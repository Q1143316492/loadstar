"""产品组装：选哪些 Capability、哪个 Provider、会话落哪。不进循环、不进 ``src/``。"""

from __future__ import annotations

import os
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path

from agent import AgentOptions, ReactLoopAgent
from cli.commands.builtins import mount_core, mount_session
from cli.commands.registry import CommandRegistry
from cli.observe import OnEnd, OnStart, wrap_tools
from compaction import CompactionCapability, CompactionOptions, LlmSummarizer
from compose import ComposeContext, compose
from llm.auth import find_api_key, resolve_api_key
from llm.deepseek import DeepSeekConfig, DeepSeekProvider
from llm.registry import ModelRegistry
from llm.types import StreamChunk
from session import JsonlSessionStore, Session
from skill import SkillCapability
from system_prompt import AgentsMdCapability, SystemPromptCapability
from workspace import BashCapability, SearchCapability, WorkspaceCapability, resolve_rg

SKILLS_DIR = Path(__file__).resolve().parent / "skills"
VENDOR_RG_DIR = Path(__file__).resolve().parent.parent / ".vendor" / "rg"
PROVIDER = "deepseek"
MODEL = "deepseek-v4-flash"
MODEL_CONTEXT_WINDOW = 131_072  # 换 MODEL 时一起改；模型能力协商还没做


@dataclass
class Booted:
    ctx: ComposeContext
    session: Session
    agent: ReactLoopAgent
    store: JsonlSessionStore
    workspace: Path
    sessions_dir: Path
    commands: CommandRegistry | None = None
    provider: object | None = None
    options: AgentOptions | None = None
    on_chunk: Callable[[StreamChunk], None] | None = None
    providers: ModelRegistry | None = None

    def replace_session(self, session: Session) -> None:
        self.session = session
        if self.provider is None or self.options is None:
            self.agent.session = session
            return
        self.agent = ReactLoopAgent(
            session,
            self.provider,
            self.options,
            self.ctx.tools,
            system_prompt=self.ctx.system_prompt,
            compaction=self.ctx.compaction,
            on_chunk=self.on_chunk,
            providers=self.providers,
        )


def api_key() -> str:
    """启动前的可用性探测；真正解析在 ``boot`` 里。"""
    return find_api_key(PROVIDER) or ""


def latest_session_id(store: JsonlSessionStore) -> str | None:
    ids = store.list()
    return ids[0] if ids else None


def cli_rg_path() -> Path | None:
    return resolve_rg(explicit=os.environ.get("WO_AGENT_RG"), vendor_dir=VENDOR_RG_DIR)


def cli_search_capability(workspace: Path) -> SearchCapability | None:
    rg = cli_rg_path()
    if rg is None:
        return None
    return SearchCapability(workspace, rg_path=rg)


def boot(
    on_chunk: Callable[[StreamChunk], None],
    resume: str | None = None,
    on_tool_start: OnStart | None = None,
    on_tool_end: OnEnd | None = None,
) -> Booted:
    key = resolve_api_key(PROVIDER)

    provider = DeepSeekProvider(
        DeepSeekConfig(api_key=key, base_url="https://api.deepseek.com", model=MODEL)
    )
    providers = ModelRegistry()
    providers.register(PROVIDER, provider)
    workspace = Path(os.environ.get("WO_AGENT_WORKSPACE") or Path.cwd()).resolve()
    sessions_dir = Path(os.environ.get("WO_AGENT_SESSIONS") or (Path.cwd() / ".wo-sessions"))
    store = JsonlSessionStore(sessions_dir)
    resume_id = resume if resume is not None else os.environ.get("WO_AGENT_SESSION")
    if resume_id == "latest":
        resume_id = latest_session_id(store)
    session = store.load(resume_id) if resume_id else None
    if resume_id and session is None:
        raise RuntimeError(f"session not found: {resume_id}")

    if session is None:
        session = Session()
    options = AgentOptions(provider=PROVIDER, model=MODEL, max_tokens=1024, retry_backoff_s=0.5)
    commands = CommandRegistry()
    mount_core(commands)
    mount_session(commands)
    capabilities = [
        SystemPromptCapability(),
        AgentsMdCapability(workspace),
        SkillCapability(SKILLS_DIR),
        WorkspaceCapability(workspace),
        BashCapability(workspace),
    ]
    search = cli_search_capability(workspace)
    if search is not None:
        capabilities.append(search)
    capabilities.append(
        CompactionCapability(
            LlmSummarizer(provider, provider_name=PROVIDER, model=MODEL),
            CompactionOptions(context_window=MODEL_CONTEXT_WINDOW),
        )
    )
    ctx = compose(*capabilities, commands=commands)
    ctx.tools = wrap_tools(ctx.tools, on_tool_start, on_tool_end)
    agent = ReactLoopAgent(
        session,
        provider,
        options,
        ctx.tools,
        system_prompt=ctx.system_prompt,
        compaction=ctx.compaction,
        on_chunk=on_chunk,
        providers=providers,
    )
    return Booted(
        ctx=ctx,
        session=session,
        agent=agent,
        store=store,
        workspace=workspace,
        sessions_dir=sessions_dir,
        commands=commands,
        provider=provider,
        options=options,
        on_chunk=on_chunk,
        providers=providers,
    )
