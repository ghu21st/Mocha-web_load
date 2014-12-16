REM ------------ kill the selenium java process if there is any running backgroud before load test --------------
taskkill /F /IM "java.exe" 
sleep 2

REM ---- start selenium server group (solution 1)
REM start "Start selenium server group with 2 client machines" /min cmd /k start_selenium_2_machine.bat

REM ---- start selenium grid hub (solution 2)
	REM ----- start selenium grid server as role hub ------- -browserTimeout 160  -timeout 300000 -DPOOL_MAX=512
REM start "Selenium server QA: selenium grid hub" /min cmd /k java -jar c:\LiveAssist_test\test\QA_TEST\selenium-server-standalone-2.43.1.jar -role hub -port 4450 -maxSession 11  
REM sleep 5

REM --- set server hub address (if used) --------  -registerCycle 5000
REM SET SeleniumServerHubAddr=http://mtl-bl1-12-vm04:4450/grid/register

REM --- start selenium server for GUI load test on Chrome
start "Selenium + Chrome driver with user: TA0001" /min cmd /k java -jar c:\LiveAssist_test\test\QA_TEST\selenium-server-standalone-2.43.1.jar -port 4441 -Dwebdriver.chrome.driver=c:\LiveAssist_test\test\QA_TEST\chromedriver.exe
sleep 2
start "Selenium + Chrome driver with user: TA0002" /min cmd /k java -jar c:\LiveAssist_test\test\QA_TEST\selenium-server-standalone-2.43.1.jar -port 4442 -Dwebdriver.chrome.driver=c:\LiveAssist_test\test\QA_TEST\chromedriver.exe
sleep 2
start "Selenium + Chrome driver with user: TA0003" /min cmd /k java -jar c:\LiveAssist_test\test\QA_TEST\selenium-server-standalone-2.43.1.jar -port 4443 -Dwebdriver.chrome.driver=c:\LiveAssist_test\test\QA_TEST\chromedriver.exe
sleep 2


REM -------------- start load test by grunt with concurrent, execute, shell modules ----------------------
REM grunt loadtest-node
