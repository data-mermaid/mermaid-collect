Update Smart Admin
===============

Current version is 1.8.7.5

updateSmartAdmin.sh is best used to understand the mapping of folders and files from a smart admin download to the mermaid project structure. Double check paths before running.

1. Change path variables in updateSmartAdmin.sh

2. Check paths in updateSmartAdmin.sh to ensure each cp command maps to the appropriate current project location.

2. Run updateSmartAdmin.sh

Note: Revert mermaid-collect/src/app/_common/layout/directives/widgets/jarvisWidget.js to dev branch version
Note: Revert mermaid-collect/smartadmin-plugin/smartwidgets/jarvis.widget.min.js to dev branch version

3. Use https://www.diffchecker.com/ to check diffs between:

a. package.json
b. bower.json
c. app.config.js
d. app.scripts.json

Note: The raphael dependency has been removed from vendor.graphs within app.scripts.json

4. Update as necessary.

