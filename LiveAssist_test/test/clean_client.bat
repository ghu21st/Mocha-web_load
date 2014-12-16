REM - clean api+gui load test master client machine before each test start

REM - move all the test logs to \bak folder before each test run
move /Y c:\LiveAssist_test\test\test_outputs\*.* c:\LiveAssist_test\test\test_outputs\bak

REM - kill java & command process
taskkill /F /IM "java.exe"
taskkill /F /IM "firefox.exe"
taskkill /F /IM "chrome.exe"
taskkill /F /IM "cmd.exe"

