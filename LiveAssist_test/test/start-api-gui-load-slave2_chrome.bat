REM ------------ kill the selenium java process if there is any running backgroud before load test --------------
taskkill /F /IM "java.exe" 
sleep 2

REM --- set server hub address (selenium group 1) at mtl-bl1-12-vm04
SET SeleniumServerHubAddr=http://10.3.41.107:4450/grid/register

REM ----- start selenium servers - Firefox
REM start "Selenium server QA: TA0004" /min cmd /k java -jar c:\LiveAssist_test\test\QA_TEST\selenium-server-standalone-2.43.1.jar -Dwebdriver.firefox.profile="TA0004" -port 4444 -profilesLocation="C:\LiveAssist_test\test\browser_profiles" -browser "browserName=firefox,maxInstances=5,platform=WINDOWS"
REM sleep 2
REM start "Selenium server QA: TA0005" /min cmd /k java -jar c:\LiveAssist_test\test\QA_TEST\selenium-server-standalone-2.43.1.jar -Dwebdriver.firefox.profile="TA0005" -port 4445 -profilesLocation="C:\LiveAssist_test\test\browser_profiles" -browser "browserName=firefox,maxInstances=5,platform=WINDOWS"
REM sleep 2
REM start "Selenium server QA: TA0006" /min cmd /k java -jar c:\LiveAssist_test\test\QA_TEST\selenium-server-standalone-2.43.1.jar -Dwebdriver.firefox.profile="TA0006" -port 4446 -profilesLocation="C:\LiveAssist_test\test\browser_profiles" -browser "browserName=firefox,maxInstances=5,platform=WINDOWS"
REM sleep 2


REM --- start selenium server for GUI load test on Chrome
start "Selenium + Chrome driver with user: TA0004" /min cmd /k java -jar c:\LiveAssist_test\test\QA_TEST\selenium-server-standalone-2.43.1.jar -port 4444 -Dwebdriver.chrome.driver=c:\LiveAssist_test\test\QA_TEST\chromedriver.exe
sleep 2
start "Selenium + Chrome driver with user: TA0005" /min cmd /k java -jar c:\LiveAssist_test\test\QA_TEST\selenium-server-standalone-2.43.1.jar -port 4445 -Dwebdriver.chrome.driver=c:\LiveAssist_test\test\QA_TEST\chromedriver.exe
sleep 2
start "Selenium + Chrome driver with user: TA0006" /min cmd /k java -jar c:\LiveAssist_test\test\QA_TEST\selenium-server-standalone-2.43.1.jar -port 4446 -Dwebdriver.chrome.driver=c:\LiveAssist_test\test\QA_TEST\chromedriver.exe
sleep 2

