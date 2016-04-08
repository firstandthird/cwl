
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
