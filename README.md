### Gitac
Gitac is nodejs based CLI that will be help you to create github release instanly. This feature will be very helpful when combined with github action for the runner. 

### How To Install
Install gitac globally
```
npm install -g gitac
```
Define Env Variable on your machines, replace below data to your actual config
```
GITAC_OWNER=hengkyawijaya
GITAC_REPO=gitac
GITAC_GITHUB_TOKEN=xxxx
```
Try some command
```
gitac --help
```
The result from the command will be 
```
gitac [command]

Commands:
  gitac release  generate draft release tag

Options:
  --version     Show version number                                    [boolean]
  --github-ref  PR merge branch refs/pull/:prNumber/merge               [string]
  --service     service name matched with label on github repo          [string]
  --prefix      group of charater before the version <prefix>0.0.0      [string]
  --postfix     group of charater after the version 0.0.0<postfix>      [string]
  --help        Show help                                              [boolean]
```

Made with <span style="color: #e25555;">&hearts;</span> by hengkyawijaya