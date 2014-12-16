#!/usr/localbin/perl
# Live Assist gui + gui load test gui log pass/fail summary result parsing script 
# usage: 
# perl parseguiTestlog.pl <target_gui_load_test_result_files_dir> <target_each_chl_gui_iteration>
# ------------------------------------------------------------

use File::Find;

$dir = $ARGV[0]; # point to test folder with gui test logs
$target_iter = $ARGV[1]; # assign target iteration #, call # over this #, no count

$filter = "gui.log";

$total_calls = 0;
$total_passed_calls = 0;
$total_failed_calls = 0;
$total_ports_count = 0;

$total_avg_gui_response_time = 0;
$total_test_elapse = 0;

$pass_rate = 0;
$fail_rate = 0;

find \&wanted,  $dir; 

for($i=0;$i<$filecount;$i++) {
	$fn = $dir . "/" . $$filelist[$i];
	print ("\n$fn ");
	if (-e $fn) {
		
		call_summary($fn);
		$total_ports_count = $total_ports_count + 1;
	}
	
}

$pass_rate = ($total_passed_calls/$total_calls);
$fail_rate = ($total_failed_calls/$total_calls);
$pass_target_rate = $total_passed_calls/($target_iter * $total_ports_count); 

	print "\n\nGUI LOG PARSING SUMMRY:\nLog dir: $dir\nTarget each channel iteration: $target_iter\n";
	print "Total calls: $total_calls\n";
	print "Total test channels: $total_ports_count\n";
	print "\t total calls passed: $total_passed_calls\n";
	print "\t total calls failed: $total_failed_calls\n";
  
	printf "\t calls pass rate is %.2f %\n", $pass_rate*100;
	printf "\t calls fail rate is %.2f %\n", $fail_rate*100;
	#printf "\t total calls passed vs target rate is %.2f %\n", $pass_target_rate*100; #note: optional just as reference, as the call can be escalated to any agent gui channel, so some channel can have more calls then others. 
	
	printf "\n\t total average gui response time (sec): %.2f", $total_avg_gui_response_time / $total_ports_count;
	printf "\n\t total gui call load test elapse (hr): %.2f", $total_test_elapse/3600/$total_ports_count;
	print "\n\n";

sub wanted
{ 
	if (-f && /$filter$/)
	{
		print "$File::Find::name\n" ; 
		push @$filelist, $_;

		$filecount++;
		print ("\n $filecount ");
	}
	
}

sub call_summary
{
	my ($file) = @_;
	open(FILE, $file) or die "could not open $file:$!";

	$calls_count = 0;
	$calls_passed = 0;
	$calls_failed = 0;
	$start_time = "undefined";
	$port_number = "undefined";

	$channel_avg_gui_response_time = 0;
	$channel_total_gui_response_time = 0;
	$channel_test_elapse = 0;

	$cnt = 0;

	while(<FILE>)
	{
		if (/(.+) - info: Test started and logging at:(.+)Test_(.+)-(.+)log/) {
			$start_time = $1;
			$port_number = $3;
		}
		if (/test elapsed/) {
			$calls_count++;
		}
		if (/passed! iteration (\d+)/) {
			if($1 < $target_iter){
				$calls_passed++;
			}
		}
		if (/failed! iteration (\d+)/) {
			if($1 < $target_iter){
				$calls_failed++;
			}
		}
	
		#note: all test scripts only calculate passed call response time (failed reponse time can be infinite or unknown larage #)
		if (/Iteration gui repsonse time = (\d+)/) {
			$channel_total_gui_response_time = $channel_total_gui_response_time + $1;

		}
		if(/Iteration test elapsed=(\d+)/){
			$channel_test_elapse = $channel_test_elapse + $1;
		}
		#
		$cnt++; 
	}

	
	$runs = $calls_passed + $calls_failed;
	
	$total_calls = $total_calls + $runs;

	$total_passed_calls = $total_passed_calls + $calls_passed;
	$total_failed_calls = $total_failed_calls + $calls_failed;

	$channel_avg_gui_response_time = $channel_total_gui_response_time / ($calls_passed + 1);
	$total_avg_gui_response_time = $total_avg_gui_response_time + $channel_avg_gui_response_time;
	$total_test_elapse = $total_test_elapse + $channel_test_elapse;
	
	print "###############################\n";
	print "FOR $port_number:\n";
	print "\tcalls count is $runs\n";
	#print "\ttotal call iteration #: $calls_count\n";
	print "\ttotal call passed iteration #: $calls_passed\n";
	print "\tcalls failed iteration #: $calls_failed\n";

	printf "\tgui call avg response time (sec): %.2f\n", $channel_avg_gui_response_time;
	printf "\tgui call test elapse(sec): %.2f \n\n", $channel_test_elapse;
	print "###############################\n";
}
