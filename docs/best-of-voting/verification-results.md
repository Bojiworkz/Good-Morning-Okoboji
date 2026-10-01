# Verification — September 30, 2026

PROVEN — Official LimeSurvey 7.4.0+260928 downloaded and extracted. PHP 8.4.26 and MariaDB 11.4.13 archives matched official SHA256 values. PHP CLI runs; required modules including PDO MySQL, mbstring, curl, XML, GD and ZIP load. The isolated MariaDB server listens on loopback port 3309. One hundred sequential PDO reads passed.

PROVEN — A portable LimeSurvey ballot was generated: three optional single-choice categories, nine fictional businesses, no public results, no IP recording, no email sends, one completed ballot per test invitation intended. File generation is not import or voting verification.

BLOCKED — Official console installation has not completed. Attempts in separate preserved schemas bestof_trial, bestof_trial2, bestof_trial3 and bestof_trial4 stalled at differing points. Neither execution outside the restricted shell nor a 15-second mysqlnd read timeout resolved it. Inspection showed all five threads of the final installer process (PID 1304 at observation) in the Suspended wait state, while PHP web-server threads and database remained responsive. The suspending actor has not been established. Asked owner whether endpoint protection shows an alert; no protections disabled and no process forcibly resumed.

PROVEN — Temporary progress instrumentation in upstream create-database.php was restored from the original. No permanent upstream core patch was retained. The incomplete schemas contain test installation data only. No production database changes or invitations occurred.

PROVEN — Canonical website build passed with development-only voting links. Because ballot setup remains incomplete, the page was restored byte-for-byte from the rollback copy; git status was clean afterwards. Private Vite preview restarted on port 5180. Browser initially showed its configuration loading state; full current runtime verification is not claimed.

NOT_RESEARCHED — Successful ballot import, admin edit/reload, browser vote submission, duplicate rejection, expiry, export reconciliation, mobile ballot UX and database restore have not been executed successfully. Do not claim launch readiness. The local admin URL currently returns a missing settings_global table error, consistent with incomplete installation.

Next: identify the Windows suspension cause without disabling security; finish official installer in one fresh trial schema; verify upstream API authentication/import; create test participants without sending emails; perform browser and export tests; then reconnect preview. Replit may refine UI after the integration contract is verified. No credentials, participant data or runtime directories should be sent to Replit or GitHub.

PROVEN — Follow-up browser check: restored Best Of page loaded on port 5180, Family filter displayed one resource, All restored four. No trial voting links remain in the page. This supersedes the earlier configuration-loading observation.
