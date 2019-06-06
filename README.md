# MultiDuetWebMonitorControl

Multi Duet Web Monitoring and Control is a fully-responsive HTML5-based web interface intended to provide "One Pane of Glass" monitoring, and some limited control, of multiple instances of Duet hardware running reprap firmware. 

Design goals:
* Reuse as much code from Duet Web Control as resonably possible.
  * Specifically, use the css, fonts, languages translation xml, without changes.
  * Use some of the javascript modules without changes. 
* Communicate with RepRapFirmware using HTTP GET requests.
* Provide "Arms length" status through color coding of large areas of the screen. 
* Be as "Self Operating" as resonably possible, such as auto-connect, auto-retry, auto status update, and similar. 
* Duet Multi is specifically NOT intended to replicate all function of "Duet Web Control".

Multi Duet Web Monitoring and Control is free software; it is licensed under the terms of the GNU Public License v2.

## Supported electronics

At this time the following platforms are supported:

* Duet 0.6
* Duet 0.8.5
* Duet WiFi
* Duet Ethernet


## Building Multi Duet Web Monitoring and Control

Pre-built zips are included.  See "Installation" below. 

Multi Duet Web Monitoring and Control can be served from three places:

1) Public internet "http://danalspub.com/MultiDWMC/"
2) Any local file system or web server on your network. 
3) Any Duet on your network, after you upload it (see below) via "http://your-printer/multi.htm"

Because Multi Duet Web Monitoring and Control uses .css, font, language.xml, and other files from DWC, and these other files will only be present on a Duet, there are two different build scripts provided. 

./buildAll.sh creates a zip with a directory structure and the required extra files making it suitable for (1) and (2) above, that is "served by a file system or web server".

./buildDuet.sh creates a zip with a directory structure and files that will work only when uploaded to a Duet that alread has DWC installed, that is "served by a duet".

To run either script, open a terminal in the github downloaded root directory and run the desired script. Refer to the build script header to see which other tools you will need. These build scripts should run on OS X or Linux.  They will not run on windows. 

Once the script has completed, the resulting .zip file,  MultiDuetWebControl-$VERSION.zip can be uploaded with the normal DWC upload process.  Just upload the whole zip. 

Once uploaded, invoke it via "http://name-or-ip-of-duet/Multi".  It need only be loaded on one Duet to monitor any number of duets. 

These packages can be uploaded via Duet Web Control to update the web interface. Due to the extra compression on the Duet WiFi, it is recommended to test new features on first-generation Duets first.

## Internationalization

Multi Duet Web Control uses the same internationalization as Duet Web Control.  See details in the Duet Web Control github project on how to enhance or contribute enhancements to the translations. 

## Installation

1) To install on a stand-alone web server, download the "MultiDuetWebControl-All-$VERSION.zip", unzip the entire directory structure to the location of your choice on the web server, and invoke via a URL that opens page "Multi.htm", such as "http://mywebserver/somedir/multi.htm"

2) To install on a local PC file system, download the "MultiDuetWebControl-All-$VERSION.zip", unzip the entire directory structure to the location of your choice on the file system, server, and invoke via a URL that opens page "Multi.htm", such as "file:///C:/Users/Joe/MultiDuet/multi.htm"

3) To install on a Duet, download the "MultiDuetWebControl-Duet-$VERSION.zip", uplod to the Duet via normal DWC 'Settings' > 'Upload File(s)' buttons.  (Do not unzip; just upload the whole zip).   Invoke via URL "http://my-duet-name-or-ip/multi.htm".  

Multi Duet Web Control and Monitoring need only be uploaded to one Duet; after loading, other Duets can be added for monitoring. 

## General Notes

* ALL configuration information is kept in browser local storage.  This means that if you run DMWMC from a different browser than where you originally set up printers, you must re-enter the printer setup information. 

* Passwords are not encrypted, neither "on the wire" nor in browser storage.  This is exactly the same as DWC. 

* Duet firmware has some oddities when clients "just go away" without disconnecting.  Try and remember to press "Disconnect All and Stop" before closing the page. 



