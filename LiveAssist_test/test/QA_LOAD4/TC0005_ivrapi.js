//TC0005-ivrapi: Live Assist load test ivr api call script
//-------------------------------------------------------
var case_ID = '0005-ivrapi';
var channel_id = '0005'; // note: the # can be the same like agent id without 'TA' prefix

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

	//for api load test response time check 
var api_time_chkpoint1 = 0;
var api_time_chkpoint2 = 0;
var api_response_time = 0;
var total_api_call_response = 0;
var avg_api_call_response = 0;

//global env settings
var TestConfig  = require('../Config/TestConfig.js');
var TEST_HOST = TestConfig.options.server;  //Ex: '10.3.41.59' change it if test server changed
var TEST_PORT = TestConfig.options.port;    //ex: '8080', change it if test server changed
var test_location = TestConfig.options.test_location;              //test base folder
//var selenium_server = TestConfig.options.selenium_server;        //default selenium server - not used by load test, using its own
var API_CALL_WAIT_ITER = TestConfig.options.api_call_wait_iter;   //api call wait iteration (unit: sec)

//for load test iteration setup ----------------
var call_run_num = TestConfig.options.api_call_number;
//  var login_logout_num = TestConfig.options.login_logout_number;
var case_call_run = 0;
//   var case_login_logout_iter = 0;

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
/* //commented the exist file remove function due to a gui channel can be failed to start and may need to be restarted in the first a few iteration of the test 
		require('fs').unlink(logFile, function(err){
			if(err){
				logger.info('Remove file error or no ' + logFile + ' exist at all\n');
			}
		});
*/
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


// start test  -------------------------------------------------------
var testAPIURL = 'http://' + TEST_HOST + ':' + TEST_PORT + '/liveassist/rest/app';
var testDebutURL = 'http://' + TEST_HOST + ':' + TEST_PORT + '/liveassist/rest/debug';

var sessionID = 0; //set initial 0, Live Assist sessionID
var call_externalSessionID = 0; //set initial 0, the real one in the test would be: 0a0325e7_00004175_528d983c_<call_iter#>_<channel#>, such as 0a0325e7_00004175_528d983c_0001_0001 -> channel 1, call iter 1 external session ID
var element1,element2, element3;

//trace HTTP call
//nock.recorder.rec();

//Call iteration start..................
//
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
                }, 3000);
            },
            //################# App test driver --- Simple app API to trigger agent escalation
            function(callback){
                //get the external session ID for each call
				var call_run_id = '0000';
				if ((case_call_run/10) >= 0 && (case_call_run/10) < 1){
					call_run_id = '000' + case_call_run.toString();
				}else if((case_call_run/10) >= 1 && (case_call_run/10) < 10){
					call_run_id = '00'+ case_call_run.toString();
				}else if((case_call_run/100) >=1 && (case_call_run/100) < 10){
					call_run_id = '0' + case_call_run.toString();
				}else{
					call_run_id = case_call_run.toString();
				}

				call_externalSessionID = '0a0325e7_00004175_528d983c_' + call_run_id + '_'+ channel_id; 
	
				//ch5: set the paramer to be posted to triggered api call, conf = 0.3, intent = EXPLAIN_FEE_REQUEST
                var testBodyParam = "ani=sip%3A5145551234%4010.3.53.192%3A5064&dnis=sip%3A4627%40mtl-da53&externalSessionID=" + call_externalSessionID + "&sessionID=&configurationName=othermenu&completionCause=success&recognitionResult=%3C%3Fxml%20version%3D%271.0%27%3F%3E%3Cemma%3Aemma%20version%3D%221.0%22%20xmlns%3Aemma%3D%22http%3A%2F%2Fwww.w3.org%2FTR%2F2007%2FCR-emma-20071211%22%20xmlns%3Anuance%3D%22http%3A%2F%2Fnr10.nuance.com%2Femma%22%3E%3Cemma%3Agrammar%20id%3D%22grammar_1%22%20ref%3D%22session%3Ahttp%3A%2F%2F10.3.41.59%3A8080%2Fliveassist%2Fdata%2Fvxmldemo%2Fivrapi%2Fcallsteering%2Fmainmenu.grxml%20-1%20-1%2010000%22%2F%3E%3Cemma%3Ainterpretation%20id%3D%22interp_1%22%20emma%3Aconfidence%3D%220.3%22%20emma%3Agrammar-ref%3D%22grammar_1%22%20emma%3Atokens%3D%22EXPLAIN%20FEE%20REQUEST%22%20emma%3Aduration%3D%221220%22%20emma%3Amode%3D%22voice%22%20nuance%3Aeos-silence%3D%221340%22%3E%3CINTENT%20%0Aconf%3D%220.3%22%3EEXPLAIN_FEE_REQUEST%3C%2FINTENT%3E%3CSWI_literal%3EEXPLAIN%20FEE%20REQUEST%3C%2FSWI_literal%3E%3CSWI_meaning%3E%7BINTENT%3AEXPLAIN_FEE_REQUEST%7D%3C%2FSWI_meaning%3E%3C%2Femma%3Ainterpretation%3E%3C%2Femma%3Aemma%3E&utterance=http%3A%2F%2Fmtl-bl1-12-vm02%3A90%2FNuance%2FcallLogs%2FIvrApiCallSteering%2F2014%2F06June%2F18%2F15%2FNUAN-09-13-mtl-bl1-12-vm02-0a032969_00002680_53a1e3d9_0007_0001-utt001-SAVEWAVEFORM.wav";

                test_client.post(testAPIURL + '/inputInteractionStep', testBodyParam, function(err, res, body){
                    if(err){
                        err_msg='Error found from http post request on /inputInteractionStep' + err;
                        err_array.push(err_msg);
                        logger.info(err_msg, err);
                        callback(err, 1);
                    }

                    //var body_ret = JSON.parse(body);
                    var body_ret = body;

                    output_string += '\n\nDebug: send post request \'\/inputInteractionStep\' done\n\n';//for debugging
                    output_string += '\npost test body param: ' + testBodyParam; //for debugging
                    output_string += '\nResponse: ' + res;//for debugging
                    output_string += '\nBody: ' + body_ret;//for debugging
                    //get session ID from the response
                    //Body: {"state":"agentPending","outcome":null,"sessionID":"session:Nuance-IvrApiCallSteering:4707f66b-4443-44dc-8408-291c9ec1690c","completionCause":null}
                    //var obj = JSON.parse(body_ret);
                    //sessionID = obj.sessionID;
                    sessionID = body.match(/sessionID>(.+)<\/sessionID/)[1]; //pattern search found the real sessionID #

                    var msg = '\nSessionID from /inputInteractionStep is: ' + sessionID;
                    output_string += msg;
                    logger.info(msg);

					//get check point 1 time
					api_time_chkpoint1 = new Date();

					//done
                    var result=[res, body];
                    callback(null, result);
                });
            },
            //wait for 1 sec
            function(callback){
                //wait for 1 sec
                setTimeout(function(){
                    output_msg = '\nwait 1 second for server\n';
                    output_string += output_msg;
                    logger.info(output_msg);

                    callback(null, 2);
                }, 1000); //old: 9000
            },
            //################# App test driver --- Simple app API to check session return result
            function(callback){
                //
                var cnt = 0;        //temp counter
                var wait_iter = API_CALL_WAIT_ITER; //wait max iteration #
                var body_ret;
                var res_ret;
                var testBodyParam = 'sessionID=' + sessionID;
                var chk_str = '<intent>';
                //
                async.whilst(
                    function(){ return cnt < wait_iter; },
                    function(cb){
                        // check session return from api call
                        test_client.post(testAPIURL + '/inputInteractionStep', testBodyParam, function(err, res, body){
                            if(err){
                                err_msg='Error found from http post request on /startSession' + err;
                                err_array.push(err_msg);
                                logger.info(err_msg, err);
                                //
                                cb(err, 3);
                            }else{
                                //var body_ret = JSON.parse(body);
                                //var body_ret = JSON.stringify(body);
                                body_ret = body;
                                res_ret = res;
                                if((body_ret.indexOf(chk_str)) >= 0){
                                    cnt = wait_iter + 1;
                                }else{
                                    cnt++;
                                }
                                //next iter
                                setTimeout(cb, 1000);
                            }
                        });
                    },
                    function(err){
                        if(err){ //the second #2 task/function found error
                            callback(err, 3);
                        }else{
                            var msg = '\n\nDebug: send post request \'\/inputInteractionStep\' done\n\n';//for debugging
                            msg += '\npost test body param: ' + testBodyParam; //for debugging
                            msg += '\nResponse: ' + res_ret;//for debugging
                            msg += '\nBody: ' + body_ret;//for debugging

                            msg += '\ncheck Session return from /inputInteracationStep is:\n' + body_ret + '\n';
                            logger.info(msg);

							//get check point 2 time
							api_time_chkpoint2 = new Date();

							//done
                            var result=[res_ret, body_ret];
                            callback(null, result);
                        }
                    }
                );
            },
            function(callback){
                //
                var testBodyParam = 'sessionID=' + sessionID;

                test_client.post(testAPIURL + '/endSession', testBodyParam, function(err, res, body){
                    if(err){
                        err_msg='Error found from http post request on /endSession' + err;
                        err_array.push(err_msg);
                        logger.info(err_msg, err);
                        callback(err, 4);
                    }

                    //var body_ret = JSON.parse(body);
                    var body_ret = body;

                    var msg = '\n\nDebug: send post request \'\/endSession\' done\n\n';//for debugging
                    msg += '\npost test body param: ' + testBodyParam; //for debugging
                    msg += '\nResponse: ' + res;//for debugging
                    msg += '\nBody: ' + body_ret;//for debugging

                    msg += '\nSessionID from /endSession is: ' + sessionID + '\n';
                    output_string += msg;
                    logger.info(msg);

                    var result=[res, body_ret];
                    callback(null, result);
                });
            },
            function(callback){
                //
                setTimeout(function(){
                    logger.info('\nwait 1 second for server\n'); //debugging
                    callback(null, 5);
               }, 2000);
            }
        ],
            function(err, result){
                //test run result check  ------------------------
                var msg = '';

                if(err){
                    //log for post test check
                    msg = '\nTest failed! iteration: ' + case_call_run + '\n';
                    msg += 'Error:\n' + JSON.stringify(e);
                    //msg += '\n\nOutput string\n' + output_string;
                }else{
                    //
                    var chk_res = 0;
                    var chk1_str = 'session:Nuance';
                    var chk2_str = '<state>agentPending</state>';
                    var chk3_str = '<intent><id>INTENT</id>';
                    //var chk4_str = '<variables><id>BILLING_MONTH</id><value>2014-01</value></variables>';

                    if((result[1][1]).indexOf(chk1_str) >= 0){
                        if((result[1][1]).indexOf(chk2_str) >= 0){
                            if((result[3][1]).indexOf(chk3_str) >= 0){
                                //   if((result[3][1]).indexOf(chk4_str) >= 0){
                                //Test check pass
                                        //Test check pass
                                        msg = '\nTest_' + case_ID + ' passed! iteration ' + case_call_run; // + '\nOutput string:\n' + output_string;

										//calculate gui response time for passed case
										api_response_time = (api_time_chkpoint2.getTime() - api_time_chkpoint1.getTime() - 1000) / 1000; //need to minus 1 sec wait timer which set in the call test
										total_api_call_response += api_response_time;
										avg_api_call_response = total_api_call_response / (case_call_run + 1);

										msg += '\n\nIteration api repsonse time = ' + api_response_time + ' sec';
										msg += '\nAvg api call response time by far = ' + avg_api_call_response + ' sec'; 

                              //     }else{
                              //          msg = '\nTest failed: ' + chk4_str + ' compare: ' + result[3][1];
                              //          chk_res++;
                              //      }
                            }else{
                                msg = '\nTest failed: ' + chk3_str + ' compare: ' + result[3][1];
                                chk_res++;
                            }
                        }else{
                            msg = '\nTest failed: ' + chk2_str + ' compare: ' + result[1][1];
                            chk_res++;
                        }
                    }else{
                        msg = '\nTest failed: ' + chk1_str + ' compare: ' + result[1][1];
                        chk_res++;
                    }
                    //
                    if(chk_res != 0){
                        msg += 'Test_' + case_ID + ' failed! iteration ' + case_call_run + '. Please check case log for details';// + '\nOutput string:\n' + msg;
                    }
                }

				//calculate case elapse
                case_endTime = new Date();
                case_elapse = (case_endTime.getTime() - case_startTime.getTime()) / 1000; //sec
                msg += '\nIteration test elapsed=' + case_elapse + ' sec\n\n'

				//logged
				logger.info(msg);

                //increase call iteration #
                case_call_run++;
				output_string = '';
                //return to next iteration
                setTimeout(callback0(), 1000);

            });

        //
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
        logger.remove(winston.transports.Console);
        logger.remove(winston.transports.File);
    }
);

