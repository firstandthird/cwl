
0.0.5 / 2016-06-10
==================

  * search requires group arg, stream now requires query arg
  * cwl - tail get rid of checking messaging
  * optimized speed
  * makes index.js use sync instead of async init
  * removed unneeded module, converted async aws init to sync for simplicity
  * update eslint,, removed extraneous log statement
  * added more-advanced aws configuration/credentials options
  * added support for passing aws credentials/region by command line
  * fixes stream.js library to show all streams for a group instead of just top 50
  * better handling of timestamp error in 'tail'
  * spinners! also features an interval countdown for 'tail'
  * tested nexttoken, seems to work
  * uses AWS filter expression, handles nextToken a little better

0.0.4 / 2016-04-08
==================

  * command line options described more clearly
  * both tail and logs use the same print options now, --prettyPrint is enabled by default
  * changed date format for log
  *  'log' is now 'logs', --printStream now an option for logs
  * Merge branch 'log' of https://github.com/firstandthird/cwl into log
  * Merge branch 'master' into log
  * don't limit initial set of logs
  * upped default limit for tail to 5k, removed tag processing options
  * upped default limit for tail to 5000, removed tag processing from logUtils
  * fixed some lint stuff
  * iterates backwards and forwards up to time the log was first grabbed
  * uses logr for printing, will try to include tags
  * d'oh forgot logUtils.js
  * cleaned up lint, commented out unused portions
  * supports iterating backwards
  * command lines and initial fetch
  * adding log action

0.0.3 / 2016-03-30
==================

  * tail more robust to network errors, etc.  now lets you specify a list of streams to show
  * tail works, now lets you pass an interval, a size limit, and a max number of times to execute

0.0.2 / 2016-03-30
==================

  * added /usr/bin/env node on top of file
