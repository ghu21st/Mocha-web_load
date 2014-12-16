/**
 QA browser test driver wrapper for Firefox/Chrome
**/
//Define the QA test wrapper for browser (Firefox or Chrome)
function ProtractorDriver(selenium_server, browser_driver, browser_user) {
    this.seleniumAddr = selenium_server;
    this.driverName = browser_driver;
	this.browserUser = browser_user;

    this.protractor = require('protractor'); //require protractor library
	this.test_config = require('../Config/TestConfig.js'); //require global configuration from this test

    this.driver = null;

    //Add for Chrome driver
	this.userArgs = '--user-data-dir=' + this.test_config.options.user_profile_location[this.browserUser]; //generate Chrome user profile location parameter argument
	this.args = ['--disable-web-security', '--start-maximized', this.userArgs];

	this.chromeOptions = this.protractor.Capabilities.chrome();
    this.chromeOptions['caps_'].chromeOptions = {
        args: this.args
    };
}

// Add methods
ProtractorDriver.prototype.create = function(){
    var self = this;

    //check which browser driver protractor need to use
    if (self.driverName == "firefox") {
        self.driver = new self.protractor.Builder().          //define driver instance for Selenium server used/wrapped with protractor
            usingServer(self.seleniumAddr).
            withCapabilities(
                self.protractor.Capabilities.firefox(self.browserUser)  //Firefox test
        ).build();
    } else if (self.driverName == "chrome") {
        self.driver = new self.protractor.Builder().          //define driver instance for Selenium server used/wrapped with protractor
            usingServer(self.seleniumAddr).
            withCapabilities(
                self.chromeOptions               //Chrome test
        ).build();
    } else {
        self.driver = null;
    }

    //return self.protractor.wrapDriver(self.driver); //old
    return [self.protractor.wrapDriver(self.driver), self.protractor];
		//for debug
	    //return [self.protractor.wrapDriver(self.driver), self.protractor, self.userArgs];
};

//exports function for protractor driver creation
exports.createPtorDriver = function(selenium_server, browser_driver, browser_user){
    return new ProtractorDriver(selenium_server, browser_driver, browser_user).create();
};



