//TC0003: Live Assist load test script with simple app IVR api + Agent GUI
//-------------------------------------------------------
var case_ID = '0003-gui';
var agent_id = 'TA0003';

var err_msg='';    //temp single error message
var err_array=[];  //error message array
var output_string=''; //result return array
var output_msg='';  //temp single result return

	//test case and total test elapse time
var case_startTime;
var case_endTime; 
var case_elapse = 0; 

var test_startTime= new Date();         //record test start time
var test_endTime; //for time elapse calculation
var test_elapse = 0;

	//for gui load test response time check 
var gui_time_chkpoint1;
var gui_time_chkpoint2;
var gui_response_time = 0;
var total_gui_call_response = 0;
var avg_gui_call_response = 0;

//global env settings
var TestConfig  = require('../Config/TestConfig.js');
var TEST_HOST = TestConfig.options.server;  //Ex: '10.3.41.59' change it if test server changed
var TEST_PORT = TestConfig.options.port;    //ex: '8080', change it if test server changed
var test_location = TestConfig.options.test_location;              //test base folder
//var selenium_server = TestConfig.options.selenium_server;        //default selenium server - not used by load test, using its own
 var test_url= TestConfig.options.test_Url;  
 
//for load test iteration setup ----------------
var call_run_num = TestConfig.options.gui_run_number;
//  var login_logout_num = TestConfig.options.login_logout_number;
var case_call_run = 0;
//   var case_login_logout_iter = 0;
var ptor_timeout = TestConfig.options.ptor_timeout_load2;

var testlog_location = test_location + "\\test_outputs";        //test log folder
var logFile = testlog_location + '\\' + 'Test_' + case_ID + '.log';    //test log file name
var logger;

var chai = require('chai');
var expect = chai.expect;
//var chaiAsPromised = require('chai-as-promised');
//chai.use(chaiAsPromised);

var request = require('request');
request = request.defaults({jar: true}); //note: this case need cookie for VXML grammar event testing!
var async = require('async');
var winston = require('winston'); //console/file logging module for testing
var os = require('os');
var nock = require('nock');   //mock library, REST API: post/put/get/delete/...
var nockOptions = {allowUnmocked: true};

var protractor = require('protractor');
var ptor, driver;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
process.setMaxListeners(0);//Define unlimited listeners
//this.timeout(40000); //set timeout for test case

//QA http test client setup ------------------------------------------
var test_client = {
    //Get method http client request
    get: function(url, cb){
        request(url, function(err, res, body){
            if(err){
                err_msg='\ntest client http get request found error: ' + err;
                err_array.push(err_msg);
                console.log(err_msg, err);
                cb(err, res, body);
            }
            cb(null, res, body);
        });
    },
    //post method http client request
    post: function(url, bodyParam, cb){
        request.post({
                headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                    'Accept': 'text/xml, application/xml, */*;q=0.2'
                },
                uri: url,
                body: bodyParam,
                json: false
            }
            ,function (err, res, body) {
                if(err){
                    err_msg='\ntest client http get request found error: ' + err;
                    err_array.push(err_msg);
                    console.log(err_msg, err);
                    cb(err, res, body);
                }else{
                    cb(null, res, body);
                }
            }
        );
    },
    //post method http client request
    post2: function(url, bodyParam, cb){
        request.post({
                headers: {'content-type': 'application/json'},
                uri: url,
                body: bodyParam,
                json: true
            }
            ,function (err, res, body) {
                if(err){
                    err_msg='\ntest client http get request found error: ' + err;
                    err_array.push(err_msg);
                    console.log(err_msg, err);
                    cb(err, res, body);
                }else{
                    cb(null, res, body);
                }
            }
        );
    },
    delete: function(url, cb){
        request.del(url, function(err, res, body){
            if(err){
                err_msg='\ntest client http get request found error: ' + err;
                err_array.push(err_msg);
                console.log(err_msg, err);
                cb(err, res, body);
            }
            cb(null, res, body);
        });
    }
};

//-----------------------------
//setup QA logging
require('fs').unlink(logFile, function(err){
    if(err){
        console.log('Remove file error or no ' + logFile + ' exist at all\n');
    }
});
logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({level: 'info'}),
        new (winston.transports.File)({
            filename: logFile,
            level: 'info',
            maxsize: 99999999,
            maxFiles: 1,
            json: false,
            timestamp: true
        })
    ]
});
logger.info('Test started and logging at: '+ logFile);
//logger.extend(console); //log everything from console to logger(save to log file)

//Protractor with wrapped Selenium WebdriverJS (internal)
var selenium_server = 'http://' + TestConfig.options.first_selenium_host + ':4443/wd/hub';
driver = new protractor.Builder().          //define driver instance for Selenium server used/wrapped with protractor
    usingServer(selenium_server).
    withCapabilities(
        protractor.Capabilities.firefox(agent_id)
    ).
    build();
ptor = protractor.wrapDriver(driver);
ptor.driver.manage().timeouts().setScriptTimeout(ptor_timeout);

// start test  -------------------------------------------------------
var testAPIURL = 'http://' + TEST_HOST + ':' + TEST_PORT + '/liveassist/rest/app';
var testDebutURL = 'http://' + TEST_HOST + ':' + TEST_PORT + '/liveassist/rest/debug';

var sessionID = 0; //set default 0
var element1,element2, element3;

//trace HTTP call
//nock.recorder.rec();

//Call iteration start..................
async.whilst(
    function(){ return case_call_run < call_run_num; },
    function(callback0){
        //------------------------------------------
        //each call start here------------------
        async.series([
            //################# Web test driver --- sign in agent GUI
            //wait for 1 sec
            function(callback){
				//get case start time
				case_startTime= new Date(); 

                //wait for 1 sec
                setTimeout(function(){
                    output_msg = '\nwait 1 second for server\n';
                    output_string += output_msg;
                    logger.info(output_msg);

                    callback(null, 0);
                }, 2000);
            },
            function(callback){
                //check only run first time to login
                if(case_call_run > 0){
                    callback(null, 3);
                }else{
                    //start web test driver based on app driver session
                    ptor.driver.get(test_url).then(function(){
                        //
                        ptor.getCurrentUrl().then(function(url){
                            output_msg = '\nCurrent URL: ' + test_url;
                            output_string += output_msg;
                            logger.info(output_msg);
                            //
                            var result = [url, 0];
                            callback(null, result);
                        });
                        //
                    });
                }
            },
            function(callback){
                //check only run first time to login
                if(case_call_run > 0){
                    callback(null, 3);
                }else{
                    ptor.getTitle().then(function(title){
                        output_msg = '\nTest web page title: ' + title;
                        output_string += output_msg;
                        logger.info(output_msg);
                        //
                        var result = [title, 0];
                        callback(null, result);
                    });
                }
            },
            function(callback){
                //check only run first time to login
                if(case_call_run > 0){
                    callback(null, 3);
                }else{
                    //wait for next page ############
                    ptor.driver.wait(function(){
                        return ptor.isElementPresent(protractor.By.model('password'));
                    }, 12000).then(function(b){
                            if(b){
                                output_msg = '\nFound the new agent web page with specific className';//for debugging
                                output_string += output_msg;
                                logger.info(output_msg);
                                //
                                ptor.getLocationAbsUrl().then(function(url){
                                    output_msg = '\nCurrent location url: ' + url;
                                    output_string += output_msg;
                                    logger.info(output_msg);
                                    //
                                    var result = [url, 0];
                                    callback(null, result);
                                });

                            }else{
                                output_msg = '\nCan not find new agent web page with specific className';//for debugging
                                output_string += output_msg;
                                logger.info(output_msg);

                                callback(null, 3)
                            }
                    });
                }
            },
            function(callback){
                //check only run first time to login
                if(case_call_run > 0){
                    callback(null, 4);
                }else{
                    //enter user name
                    element1 = ptor.element(protractor.By.model('username'));
                    element1.sendKeys(agent_id).then(function(){
                        output_msg = '\nSet user login name variable';
                        output_string += output_msg;
                        logger.info(output_msg);
                        //
                        callback(null, 4);
                    });
                }
            },
            function(callback){
                //check only run first time to login
                if(case_call_run > 0){
                    callback(null, 5);
                }else{
                    //enter password
                    element1 = ptor.element(protractor.By.model('password'));
                    element1.sendKeys(agent_id).then(function(){
                        output_msg = '\nSet password variable';
                        output_string += output_msg;
                        logger.info(output_msg);
                        //
                        callback(null, 5);
                    });
                }
            },
            function(callback){
                //check only run first time to login
                if(case_call_run > 0){
                    callback(null, 6);
                }else{
                    //test on ng-click and button #####################
                    element1 = ptor.element(protractor.By.id('agentSignInButton'));
                    element1.click().then(function(){
                        output_msg = '\nSign in button clicked';
                        output_string += output_msg;
                        logger.info(output_msg);
                        //
                        callback(null, 6);
                    });
                }
            },
            //wait for 1 sec
            function(callback){
                //wait for 1 sec
                setTimeout(function(){
                    output_msg = '\nwait 1 second for server\n';
                    output_string += output_msg;
                    logger.info(output_msg);

                    callback(null, 7);
                }, 1000); //
            },
            function(callback){
                //wait for next page ############
                ptor.driver.wait(function(){
                    return ptor.isElementPresent(protractor.By.id('signOutButton'));
                }, 210000).then(function(b){
                        if(b){
                            output_msg = '\nFound the new agent web page with specific className';//for debugging
                            output_string += output_msg;
                            logger.info(output_msg);
                            //
                            ptor.getLocationAbsUrl().then(function(url){
                                output_msg = '\nCurrent location url: ' + url;
                                output_string += output_msg;
                                logger.info(output_msg);
                                //
                                var result = [url, 0];
                                callback(null, result);
                            });

                        }else{
                            output_msg = '\nCan not find specific agent web page!!!';//for debugging
                            output_string += output_msg;
                            logger.info(output_msg);

                            //click sign out button - robust
                         /*   element1 = ptor.element(protractor.By.id('signOutButton'));
                            element1.click().then(function(){
                                output_msg = '\nsignOutButton button clicked';
                                output_string += output_msg;
                                logger.info(output_msg);
                          */      //
                                callback(output_msg, 15);
                          //  });
                        }
                    });
            },
            //wait for 1 sec
            function(callback){
                //wait for 1 sec
                setTimeout(function(){
                    output_msg = '\nwait 1 second for server\n';
                    output_string += output_msg;
                    logger.info(output_msg);

                    callback(null, 7);
                }, 100); //old: 100
            },
            //################ Web test driver --- AngularJS Agent GUI to trigger agent selection and outcome
            function(callback){
                //wait for next page ############
                ptor.driver.wait(function(){
                    return ptor.isElementPresent(protractor.By.id('doneButton'));
                }, 200000).then(function(b){ //old: 8000
                        if(b){
                            output_msg = '\nFound the new agent web page with specific className';//for debugging
                            output_string += output_msg;
                            logger.info(output_msg);
                            //
                            ptor.getLocationAbsUrl().then(function(url){
                                output_msg = '\nCurrent location url: ' + url;
                                output_string += output_msg;
                                logger.info(output_msg);
                                
								//get check point 1 time
								gui_time_chkpoint1 = new Date();

								//done
                                var result = [url, 0];
                                callback(null, result);
                            });

                        }else{
                            output_msg = '\nCan not find specific agent web page!!!';//for debugging
                            output_string += output_msg;
                            logger.info(output_msg);

                        /*    //click sign out button - robust
                            element1 = ptor.element(protractor.By.id('signOutButton'));
                            element1.click().then(function(){
                                output_msg = '\nsignOutButton button clicked';
                                output_string += output_msg;
                                logger.info(output_msg);
                          */      //
                                callback(null, 8);
                         //   });

                        }
                    });
            },
            function(callback){
                //test on ng-repeat  ##############
                element1 = ptor.findElements(protractor.By.repeater('intent in intents')).then(function(arr){
                    arr[0].evaluate('intent.name').then(function(intent_name){
                        element2 = ptor.element(protractor.By.partialLinkText(intent_name));
                        element2.click().then(function(){
                            ptor.findElements(protractor.By.repeater('intent in selectedIntents[0].members')).then(function(arr){
                                arr[0].evaluate('intent.name').then(function(intent_name){
                                    ptor.element(protractor.By.partialLinkText(intent_name)).click().then(function(){
                                        ptor.findElements(protractor.By.repeater('intent in selectedIntents[1].members')).then(function(arr){
                                            arr[0].evaluate('intent.name').then(function(intent_name){
                                                ptor.element(protractor.By.partialLinkText(intent_name)).click().then(function(){
                                                    output_msg = '\nCurrent intent selection: ' + intent_name;
                                                    output_string += output_msg;
                                                    logger.info(output_msg);
                                                    //
                                                    var result = [intent_name, 0];
                                                    callback(null, result);
                                                });
                                            });
                                        });

                                    });
                                });
                            });
                        });
                    });
                });
            },
            //wait for 1 sec
            function(callback){
                //wait for 1 sec
                setTimeout(function(){
                    output_msg = '\nwait 1 second for server\n';
                    output_string += output_msg;
                    logger.info(output_msg);

                    callback(null, 10);
               }, 2000); //old: 1000,
            },

            function(callback){
                //test on ng-click and button #####################
                element1 = ptor.element(protractor.By.id('doneButton'));
                element1.click().then(function(){
                    output_msg = '\nDone button clicked';
                    output_string += output_msg;
                    logger.info(output_msg);

					//get check point 2 time
					gui_time_chkpoint2 = new Date();

					//done
                    callback(null, 11);
                });
            },
            function(callback){
                //check if the last iteration run, logout
                if(case_call_run < (call_run_num - 1)){
                    callback(null, 13);
                }else{
                    //wait for next page ############
                    ptor.driver.wait(function(){
                        return ptor.isElementPresent(protractor.By.id('signOutButton'));
                    }, 12000).then(function(b){
                            if(b){
                                output_msg = '\nFound the new agent web page with specific className';//for debugging
                                output_string += output_msg;
                                logger.info(output_msg);
                                //
								element1 = ptor.element(protractor.By.id('signOutButton'));
								element1.click().then(function(){
									output_msg = '\nSign out button clicked';
									output_string += output_msg;
									logger.info(output_msg);
									//
									callback(null, 14);
								});

                            }else{
                                output_msg = '\nCan not find specific agent web page!!!';//for debugging
                                output_string += output_msg;
                                logger.info(output_msg);
                    
                                    //
                                callback(null, 13);
                            }
                        });
                }
            },
            function(callback){
                if(case_call_run < (call_run_num - 1)){
                    callback(null, 13);
                }else{
                    //cleanup before quit the test
            //        var adminGUIAPI = 'http://' + TEST_HOST + ':' + TEST_PORT + '/liveassist/rest/admin/agents';
            //        var logoutURL = adminGUIAPI + '/' + agent_id + '/logout';
			        var logoutURL = 'https://' + TEST_HOST + ':8443' + '/liveassist/app/logout'; //special https request to logout agent

                    test_client.get(logoutURL, function(err, res, body){
                        if(err){
                            err_msg='Error found from http get request on: ' + logoutURL + err;
                            err_array.push(err_msg);
                            logger.info(err_msg);
                        }
                        logger.info('\nMake sure agent logout before exit!\n' + logoutURL + '\n' + body + '\n');
                        callback(null, 13);
                    });
                }
            },
            function(callback){
                //
                setTimeout(function(){
                    logger.info('\nwait 1 second for server\n'); //debugging
                    callback(null, 15);
                }, 3500);
            }
        ],
            function(err, result){
                //test run result check  ------------------------
                var msg = '';

                if(err){ //case fail
                    logger.info('\n\nERROR found during agent web UI login. Quit!\n' + err + '\n\n');
                    //log for post test check
                    msg = '\nTest failed! iteration: ' + case_call_run;
                    msg += 'Error:\n' + JSON.stringify(e);
                    //msg += '\n\nOutput string\n' + output_string;
                 }else{  //case pass
					//calculate gui response time 
					gui_response_time = (gui_time_chkpoint2.getTime() - gui_time_chkpoint1.getTime()) / 1000;
					total_gui_call_response += gui_response_time;
					avg_gui_call_response = total_gui_call_response / (case_call_run + 1);

                    msg = '\nTest_' + case_ID + ' passed! iteration ' + case_call_run; //+ '\nOutput string:\n' + output_string;
					msg += '\nIteration gui repsonse time = ' + gui_response_time + ' sec';
					msg += '\nAvg gui response time for api call by far = ' + avg_gui_call_response  + ' sec';

				}
	
				//calculate case elapse
                case_endTime = new Date();
                case_elapse = (case_endTime.getTime() - case_startTime.getTime()) / 1000; //sec
                msg += '\nIteration test elapsed=' + case_elapse + ' sec \n\n'

				//logged
				logger.info(msg);
			
                //increase call iteration #
                case_call_run++;

                //return to next iteration
                setTimeout(callback0(), 1000);
            });
    },
    //end async.whilst
    function(err){
        //successfully reached to the end of total iteration call number
        //logged pass (note: assertion pass/fail should be checked and logged in each iteration call)
        var pass_msg = '\n\nAll call iteration done! on Test_' + case_ID + '\n' + 'Total test iteration:' + case_call_run + '\n';
        
		//calculate test elapse
		test_endTime = new Date();
		test_elapse = (test_endTime.getTime() - test_startTime.getTime())/1000/3600; //hr
		
		//
		logger.info(pass_msg + '\n' + 'Total test running elapsed=' + test_elapse + ' hr\n\n');

        //cleanup before quit the test
//        var adminGUIAPI = 'http://' + TEST_HOST + ':' + TEST_PORT + '/liveassist/rest/admin/agents';
//        var logoutURL = adminGUIAPI + '/' + agent_id + '/logout';
        var logoutURL = 'https://' + TEST_HOST + ':8443' + '/liveassist/app/logout'; //special https request to logout agent

        test_client.get(logoutURL, function(err, res, body){
            if(err){
                err_msg='Error found from http get request on: ' + logoutURL + err;
                err_array.push(err_msg);
                logger.info(err_msg);
            }
            logger.info('\nMake sure agent logout before exit!\n' + logoutURL + '\n' + body + '\n');
            ptor.driver.quit().then(function(){
                logger.remove(winston.transports.Console);
                logger.remove(winston.transports.File);
            });
        });
    }

);

