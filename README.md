### Gitac
Gitac is nodejs based CLI that will be help you to create github release instanly. This feature will be very helpful when combined with github action for the runner. 

### How To Install
Clone the repo
```
git clone git@github.com:hengkyawijaya/gitac.git
```
Install the dependency inside root directory
```
npm install
```
Copy env sample with command bellow, then configure the env variable depends on your needs
```
cp .env.sample .env
```
Execute npm link to connect script to the bin
```
npm link
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
  --help        Show help                                              [boolean]
```

Made with <span style="color: #e25555;">&hearts;</span> by hengkyawijaya