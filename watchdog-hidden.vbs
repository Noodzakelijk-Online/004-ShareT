' Runs watchdog.bat completely hidden (no console window flashing every tick).
' The scheduled task calls this VBS instead of the .bat directly.
Set fso = CreateObject("Scripting.FileSystemObject")
Set sh  = CreateObject("WScript.Shell")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
' 0 = hidden window, False = don't wait for it to finish
sh.Run "cmd /c """ & scriptDir & "\watchdog.bat""", 0, False
