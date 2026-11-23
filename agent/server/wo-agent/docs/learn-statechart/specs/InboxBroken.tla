---------------------------- MODULE InboxBroken ----------------------------
\* Model of agent/inbox.py: two queues plus an atomic claim.
\* Deliberately NOT modeled: message payload, coroutines, cancel().
\* Those are listed in the tutorial as "out of model".

EXTENDS Naturals, Sequences

CONSTANT MaxItems   \* bound on each queue; keeps the state space finite

VARIABLES
    nextTurn,   \* next-turn queue: sequence of message ids
    nextStep,   \* next-step queue: sequence of message ids
    claimed,    \* ids that have been handed to the loop
    pushed,     \* ghost: every id ever pushed (code has no such variable)
    nextId      \* id generator

vars == <<nextTurn, nextStep, claimed, pushed, nextId>>

\* Set of elements in a queue. Empty queue gives the empty set.
QueueSet(s) == { s[i] : i \in 1..Len(s) }

Init ==
    /\ nextTurn = <<>>
    /\ nextStep = <<>>
    /\ claimed = {}
    /\ pushed  = {}
    /\ nextId  = 0

PushTurn ==
    /\ Len(nextTurn) < MaxItems
    /\ nextTurn' = Append(nextTurn, nextId)
    /\ nextStep' = nextStep
    /\ claimed'  = claimed
    /\ pushed'   = pushed \cup {nextId}
    /\ nextId'   = nextId + 1

PushStep ==
    /\ Len(nextStep) < MaxItems
    /\ nextStep' = Append(nextStep, nextId)
    /\ nextTurn' = nextTurn
    /\ claimed'  = claimed
    /\ pushed'   = pushed \cup {nextId}
    /\ nextId'   = nextId + 1

\* claim("next-step"): drain every pending step message.
ClaimStep ==
    /\ nextStep' = <<>>
    /\ nextTurn' = nextTurn
    /\ claimed'  = claimed \cup QueueSet(nextStep)
    /\ pushed'   = pushed
    /\ nextId'   = nextId

\* claim("next-turn"): drain next-step, then take one from the head.
ClaimTurn ==
    /\ Len(nextTurn) > 0
    /\ nextTurn' = Tail(nextTurn)
    /\ nextStep' = <<>>
    /\ claimed'  = claimed \cup {Head(nextTurn)}
    /\ pushed'   = pushed
    /\ nextId'   = nextId

Next == PushTurn \/ PushStep \/ ClaimStep \/ ClaimTurn

Spec == Init /\ [][Next]_vars

\* nextId grows without bound, so the state space would be infinite.
\* TLC stops exploring past this bound (it still checks the invariant here).
NextIdBound == nextId <= 4

---------------------------------------------------------------------
\* Rules (invariants). Each one is a sentence the reader agreed to.

TypeOK ==
    /\ Len(nextTurn) <= MaxItems
    /\ Len(nextStep) <= MaxItems
    /\ claimed \subseteq pushed

\* No message sits in a queue after it was already handed out.
NoDoubleClaim ==
    /\ \A i \in 1..Len(nextTurn) : nextTurn[i] \notin claimed
    /\ \A i \in 1..Len(nextStep) : nextStep[i] \notin claimed

\* Every pushed message is either still queued or was claimed.
\* Nothing is lost, nothing is invented.
NoLoss ==
    pushed \subseteq claimed \cup QueueSet(nextTurn) \cup QueueSet(nextStep)

=====================================================================
