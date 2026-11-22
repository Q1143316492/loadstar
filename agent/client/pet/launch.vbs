' 隐藏控制台窗口启动桌宠；开机自启的快捷方式指向本文件。
' 目标写法见 agent/README.md 第 4 步。
Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

appDir = fso.GetParentFolderName(WScript.ScriptFullName)
electron = appDir & "\node_modules\electron\dist\electron.exe"

If Not fso.FileExists(electron) Then
  MsgBox "找不到 Electron：" & electron & vbCrLf & "先在 agent\client\pet 下运行 npm install。", 16, "cwl-pet"
  WScript.Quit 1
End If

shell.CurrentDirectory = appDir
shell.Run """" & electron & """ """ & appDir & """", 0, False
