REM start "Selenium server QA: TA0006" /min cmd /k java -jar c:\LiveAssist_test\test\QA_TEST\selenium-server-standalone-2.42.2.jar -firefoxProfileTemplate "C:\LiveAssist_test\test\browser_profiles\TA0006" -port 4441
REM start "Selenium server QA: TA0006" /min cmd /k java -jar c:\LiveAssist_test\test\QA_TEST\selenium-server-standalone-2.42.2.jar -Dwebdriver.firefox.profile="TA0006" -port 4446
REM start "Selenium server QA: TA0001" /min cmd /k java -jar c:\LiveAssist_test\test\QA_TEST\selenium-server-standalone-2.42.2.jar -role node -hub http://localhost:4444/grid/register -Dwebdriver.firefox.profile="TA0001" -port 4446 -maxSession 12 -browserTimeout 60
REM sleep 5

sleep 57

REM ---------start gui load script first--------------
start "GUI load test script: TA0006" /min cmd /k node c:\LiveAssist_test\test\QA_LOAD4\TC0006_gui.js
sleep 5

REM --------start ivr api call load script second ----------
start "IVR api call load test script: TA0006" /min cmd /k node c:\LiveAssist_test\test\QA_LOAD4\TC0006_ivrapi.js
sleep 2

REM ---------start web api call load script second-----------
REM start "web api call load test script: TA0006" /min cmd /k node c:\LiveAssist_test\test\QA_LOAD4\TC0006_webapi.js
REM sleep 2

exit 0

