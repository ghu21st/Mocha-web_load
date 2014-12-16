REM start "Selenium server QA: TA0000" /min cmd /k java -jar c:\LiveAssist_test\test\QA_TEST\selenium-server-standalone-2.41.0.jar -Dwebdriver.firefox.profile="TA0000" -port 4440 -profilesLocation="C:\LiveAssist_test\test\browser_profiles" -browser "browserName=firefox,maxInstances=5,platform=WINDOWS"
REM start "Selenium server QA: TA0000" /min cmd /k java -jar c:\LiveAssist_test\test\QA_TEST\selenium-server-standalone-2.41.0.jar -role node -hub http://localhost:4444/grid/register -Dwebdriver.firefox.profile="TA0000" -port 4440 -maxSession 12 -browserTimeout 60

REM sleep 6

sleep 26

REM start gui load script first
start "GUI load test script: TA0000" /min cmd /k node c:\LiveAssist_test\test\QA_LOAD3\TC0000_gui.js
sleep 6

REM start api call load script second
start "IVR api call load test script: TA0000" /min cmd /k node c:\LiveAssist_test\test\QA_LOAD3\TC0000_ivrapi.js
sleep 1

exit 0

