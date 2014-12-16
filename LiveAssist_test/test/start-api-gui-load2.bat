REM ------------ kill the selenium java process if there is any running backgroud before load test --------------
taskkill /F /IM "java.exe" 
sleep 2

REM ---- start selenium server group (solution 1)
REM start "Start selenium server group with 2 client machines" /min cmd /k start_selenium_2_machine.bat

REM ---- start selenium grid hub (solution 2)
	REM ----- start selenium grid server as role hub ------- -browserTimeout 160  -timeout 300000 -DPOOL_MAX=512
REM start "Selenium server QA: selenium grid hub" /min cmd /k java -jar c:\LiveAssist_test\test\QA_TEST\selenium-server-standalone-2.42.2.jar -role hub -port 4450 -maxSession 11  
REM sleep 5

REM --- set server hub address (if used) --------  -registerCycle 5000
REM SET SeleniumServerHubAddr=http://mtl-bl1-12-vm04:4450/grid/register

REM --- start selenium server node group 1 on local test machine ----- (-nodeTimeout 150)
start "Selenium server QA: TA0001" /min cmd /k java -jar c:\LiveAssist_test\test\QA_TEST\selenium-server-standalone-2.42.2.jar -Dwebdriver.firefox.profile="TA0001" -port 4441 -profilesLocation="C:\LiveAssist_test\test\browser_profiles" -browser "browserName=firefox,maxInstances=5,platform=WINDOWS"
sleep 2
start "Selenium server QA: TA0002" /min cmd /k java -jar c:\LiveAssist_test\test\QA_TEST\selenium-server-standalone-2.42.2.jar -Dwebdriver.firefox.profile="TA0002" -port 4442 -profilesLocation="C:\LiveAssist_test\test\browser_profiles" -browser "browserName=firefox,maxInstances=5,platform=WINDOWS"
sleep 2
start "Selenium server QA: TA0003" /min cmd /k java -jar c:\LiveAssist_test\test\QA_TEST\selenium-server-standalone-2.42.2.jar -Dwebdriver.firefox.profile="TA0003" -port 4443 -profilesLocation="C:\LiveAssist_test\test\browser_profiles" -browser "browserName=firefox,maxInstances=5,platform=WINDOWS"
sleep 2

REM start "Selenium server QA: TA0004" /min cmd /k java -jar c:\LiveAssist_test\test\QA_TEST\selenium-server-standalone-2.42.2.jar -Dwebdriver.firefox.profile="TA0004" -port 4444 -profilesLocation="C:\LiveAssist_test\test\browser_profiles" -browser "browserName=firefox,maxInstances=5,platform=WINDOWS"
REM sleep 2
REM start "Selenium server QA: TA0005" /min cmd /k java -jar c:\LiveAssist_test\test\QA_TEST\selenium-server-standalone-2.42.2.jar -Dwebdriver.firefox.profile="TA0005" -port 4445 -profilesLocation="C:\LiveAssist_test\test\browser_profiles" -browser "browserName=firefox,maxInstances=5,platform=WINDOWS"
REM sleep 2

REM --- start by selenium servrs node group on another test machine ! ---------
REM start "Selenium server QA: TA0006" /min cmd /k java -jar c:\LiveAssist_test\test\QA_TEST\selenium-server-standalone-2.42.2.jar -Dwebdriver.firefox.profile="TA0006" -port 4446 -profilesLocation="C:\LiveAssist_test\test\browser_profiles" -browser "browserName=firefox,maxInstances=5,platform=WINDOWS"
REM sleep 1
REM start "Selenium server QA: TA0007" /min cmd /k java -jar c:\LiveAssist_test\test\QA_TEST\selenium-server-standalone-2.42.2.jar -Dwebdriver.firefox.profile="TA0007" -port 4447 -profilesLocation="C:\LiveAssist_test\test\browser_profiles" -browser "browserName=firefox,maxInstances=5,platform=WINDOWS"
REM sleep 1
REM start "Selenium server QA: TA0008" /min cmd /k java -jar c:\LiveAssist_test\test\QA_TEST\selenium-server-standalone-2.42.2.jar -Dwebdriver.firefox.profile="TA0008" -port 4448 -profilesLocation="C:\LiveAssist_test\test\browser_profiles" -browser "browserName=firefox,maxInstances=5,platform=WINDOWS"
REM sleep 1
REM start "Selenium server QA: TA0009" /min cmd /k java -jar c:\LiveAssist_test\test\QA_TEST\selenium-server-standalone-2.42.2.jar -Dwebdriver.firefox.profile="TA0009" -port 4449 -profilesLocation="C:\LiveAssist_test\test\browser_profiles" -browser "browserName=firefox,maxInstances=5,platform=WINDOWS"
REM sleep 1
REM start "Selenium server QA: TA0000" /min cmd /k java -jar c:\LiveAssist_test\test\QA_TEST\selenium-server-standalone-2.42.2.jar -Dwebdriver.firefox.profile="TA0000" -port 4440 -profilesLocation="C:\LiveAssist_test\test\browser_profiles" -browser "browserName=firefox,maxInstances=5,platform=WINDOWS"
REM sleep 1

REM -------------- start load test by grunt with concurrent, execute, shell modules ----------------------
REM grunt loadtest-node
