# Revised configuration — review candidate

This configuration reduces privileges and separates installation from normal operation. It is not installed in the application and does not restore or exclude a quarantined file.

Changes from the first trial config:
- Fixed loopback database endpoint and fixed trial database name.
- Dedicated `bestof_app` database identity instead of root. This identity still needs provisioning with privileges restricted to the trial schema; changing its name here does not grant or constrain an actual account.
- Database password supplied through BESTOF_DB_PASSWORD. No secret value, JSON credential-file read or administrator bootstrap password in this configuration. Environment variables are still sensitive and must be protected by the launcher/process environment.
- Missing database password stops loading rather than falling back to an empty/root password.
- Direct HTTP access stops before reading credentials.
- Debug and SQL debugging remain off. RemoteControl API is off until an authenticated integration is specifically enabled and tested.
- Restores the upstream seven-day update-check setting.

No shell commands, downloads, code evaluation, permission changes, credential creation or database writes occur in this configuration itself. Loading it by LimeSurvey will configure the application's database connection. This source review does not certify the whole application or prove Norton's original finding false.

Not a deployment package: provision and test a schema-scoped database account, complete the official installation separately, inject the credential without logging it, resolve the Norton detection, then test application startup and voting. The earlier API provisioning script needs RemoteControl enabled for its bounded setup operation; do not run it expecting this runtime config to allow API calls.
