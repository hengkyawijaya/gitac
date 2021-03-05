#!/usr/bin/env node

const Octokit = require("@octokit/core").Octokit
const yargs = require("yargs/yargs")
const hideBin = require("yargs/helpers").hideBin
require("dotenv").config()

const releaseType = "patch"
const patternRelease = /(?<prefix>[a-zA-Z]+)?(?<major>\d+)(\.)(?<minor>\d+)(\.)(?<patch>\d+)?(?<postfix>[a-zA-Z]+)?/g
const patternGithubRef = /(refs\/pull\/)(?<prnum>\d+)(\/merge)$/g
const owner = process.env.GITAC_OWNER
const repo = process.env.GITAC_REPO
const githubToken = process.env.GITAC_GITHUB_TOKEN
const octokit = new Octokit({ auth: githubToken });

const argv = yargs(hideBin(process.argv)).command('release', 'generate draft release tag')
    .option('github-ref', {
        description: 'PR merge branch refs/pull/:prNumber/merge',
        type: 'string',
    })
    .option('service', {
        description: 'service name matched with label on github repo',
        type: 'string',
    })
    .option('prefix', {
        description: 'group of charater before the version <prefix>0.0.0',
        type: 'string',
    })
    .option('postfix', {
        description: 'group of charater after the version 0.0.0<postfix>',
        type: 'string',
    })
    .help()
    .argv;

async function createRelease() {
    var result = patternGithubRef.exec(argv['github-ref'])
    if (result == null) {
        console.log("invalid github-ref value")
        return
    }

    const service = argv['service']
    if (service == ""){
        console.log("service name is required")
        return
    }

    const prefix = argv['prefix']
    const postfix = argv['postfix']
   
    try {
        var prnum = result.groups.prnum  
        response = await octokit.request(`GET /repos/${owner}/${repo}/pulls/${prnum}`, {
            owner: owner,
            repo: repo,
        })
       
        const { closed_at, merged_at, user, title, labels } = response.data

        var isCorrectService = false
        for (const label of labels) {
            isCorrectService = label.name == service
            if (isCorrectService) {
                console.log("service tag found: ", label.name)
                break
            }
        }

        if(!isCorrectService) {
            console.log("label service doesn't match with ", service)
            return
        }

        var isOpenPR = closed_at == null && merged_at == null
        if (isOpenPR) {
            console.log("Status: OPEN")
            return
        }

        var isClosePR = closed_at != null && merged_at == null
        if (isClosePR) {
            console.log("Status: CLOSE")
            return
        }

        var isMergePR = closed_at != null && merged_at != null
        if (isMergePR) {
            console.log("Status: MERGE")
        }   

        response = await octokit.request(`GET /repos/${owner}/${repo}/releases`, {
            owner: owner,
            repo: repo,
        })

        var isDraftExist = false
        var existingDraftID = 0
        var latestRelease = ""
        var latestMajor = 0
        var latestMinor = 0
        var latestPatch = 0       
        for (const release of response.data) {
            var regexPattern = new RegExp(patternRelease, 'i')
            var result = regexPattern.exec(release.tag_name)
            var isMatchTagName = result == null
            if (isMatchTagName) {
                continue
            }

            var isMatchPrefixOrPostfix = prefix == result.groups['prefix'] || postfix == result.groups['postfix']
            if (isMatchPrefixOrPostfix) {
                var isLatestReleaseEmpty = latestRelease == ""
                if (isLatestReleaseEmpty) {
                    latestRelease = release.tag_name
                    latestMajor = parseInt(result.groups['major'])
                    latestMinor = parseInt(result.groups['minor'])
                    latestPatch = parseInt(result.groups['patch'])
                }
                isDraftExist = release.draft
                if (isDraftExist) {
                    existingDraftID = release.id
                    break
                }
            }
        }

        changesLog = `* ${title} #${prnum} @${user.login}`
        if(isDraftExist) { 
            console.log('existing latest release:', latestRelease)
            await appendChangesLog(latestRelease, existingDraftID, changesLog)
            return
        }

        var { latestMajor, latestMinor, latestPatch } = increaseVersion(releaseType, latestMajor, latestMinor, latestPatch)
        latestRelease = `${prefix}${latestMajor}.${latestMinor}.${latestPatch}${postfix}`
        console.log('new latest release:', latestRelease)
        await generateNewRelease(latestRelease, changesLog)

    } catch(err) {
        console.log("error ", err)
    }
}

createRelease()

function increaseVersion(releaseType, latestMajor, latestMinor, latestPatch) {
    switch (releaseType) {
        case 'major':
            latestMajor++
            break
        case 'minor':
            if (latestMinor < 100) {
                latestMinor++
                break
            }
            latestMinor = 0
            latestMajor++
            break
        default:
            if (latestPatch < 100) {
                latestPatch++
                break
            }
            latestPatch = 0
            if (latestMinor < 100) {
                latestMinor++
                break
            }
            latestMinor = 0
            latestMajor++
            break
    }

    return {latestMajor, latestMinor, latestPatch}
}

async function generateNewRelease(latestRelease, changesLog) {
    await octokit.request(`POST /repos/{owner}/{repo}/releases`, {
        owner: owner,
        repo: repo,
        tag_name: latestRelease,
        draft: true,
        prerelease: true,
        name: latestRelease,
        body: `Changes: \n${changesLog}`,
    })
    console.log('create new draft release')
}

async function appendChangesLog(latestRelease, existingDraftID, changesLog) {
    var response = await octokit.request(`GET /repos/{owner}/{repo}/releases/{asset_id}`, {
        owner: owner,
        repo: repo,
        asset_id: `${existingDraftID}`,
    })

    var newBody = `${response.data.body} \n${changesLog}`
    var response = await octokit.request(`PATCH /repos/{owner}/{repo}/releases/{asset_id}`, {
        owner: owner,
        repo: repo,
        asset_id: existingDraftID,
        draft: true,
        prerelease: true,
        tag_name: latestRelease,
        body: newBody,
    })
    console.log('update draft release')
}
