# Aqua Pipeline Security

This action is used to protect your GitHub workflows by generating an activity profile of your workflow job using Aqua Security's [Tracee](https://github.com/aquasecurity/tracee).
The profile provides visibility of your workflow jobs activity and allows you to enforce policies from Aqua platform.
To use this action, you need to have an Aqua account and generate a key and a secret from Aqua platform.

Open source version of this action is available [here](https://github.com/aquasecurity/tracee-action).

---

## Table of Contents

- [Threats](#threats)
- [Protection](#protection)
  - [Activity Profiling](#activity-profiling)
  - [Suspicious Behavior Detection](#suspicious-behavior-detection)
- [Usage](#usage)
- [Inputs](#inputs)

---

## Threats

By using this action, you protect your workflow jobs from the following threats:

|     | Threat                | Description                                                                                                                                                 | Examples                                                                                                                           |
| --- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 1.  | Secrets exfiltration  | Malicious packages or pipeline dependencies might steal your secrets by making a network call with your pipeline secrets                                    | [Codecov breach](https://blog.aquasec.com/codecovs-breach-supply-chain-attack)                                                     |
| 2.  | Source code tampering | Malicious dependencies or compromised runner might edit your source code before the artifact is being built to inject a backdoor or insert a malicious code | [Solarwinds incident](https://www.aquasec.com/cloud-native-academy/supply-chain-security/solarwinds-attack/)                       |
| 3.  | Compromised Runner    | Your runner might be breached, and is running a malware or a crypto miner                                                                                   | [Crypto mining in the CI](https://blog.aquasec.com/container-security-alert-campaign-abusing-github-dockerhub-travis-ci-circle-ci) |

---

## Protection

The protection is being made by 2 main components. All the data is being sent to Aqua platform, and is being used to enforce policies.

### Activity Profiling

The action generates a profile of your workflow job, and sends it to Aqua platform. The profile includes the following data:

1. Network calls - a list of all the network calls made during the pipeline execution.
2. Repository filesystem changes - a list of all the changes that are made inside the repository file system (source code, package managers etc.) during the pipeline execution.
3. Containers executions - a list of all the containers that were executed during the pipeline execution.

### Suspicious Behavior Detection

Tracee runs in the background and hunts for suspicious behavior in the runner and in the workflow. It uses the powerful set of behavioral signatures that is based on Aqua's research. You can add your own specific signatures to detect unwanted behavior.

---

## Usage

### Profile your workflow job

```yaml
name: Build
on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Tracee
        uses: aquasecurity/trace-commercial-action@v1
        with:
          aqua-key: ${{ secrets.AQUA_KEY }}
          aqua-secret: ${{ secrets.AQUA_SECRET }}
          access-token: ${{ secrets.GITHUB_TOKEN }}
      - ...
```

### If the repository is cloned in a different folder

```yaml
name: Build
on: [push]

jobs:
  build:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v2
      with:
        path: my-repo
    - name: Tracee
      uses: aquasecurity/trace-commercial-action@v1
      with:
        aqua-key: ${{ secrets.AQUA_KEY }}
        aqua-secret: ${{ secrets.AQUA_SECRET }}
        access-token: ${{ secrets.GITHUB_TOKEN }}
        repo-path: my-repo
    - ...
```

---

## Inputs

| Name           | type     | description                                                                                                                                                                                         | required | default             |
| -------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------- |
| `aqua-key`     | `string` | Aqua key                                                                                                                                                                                            | `true`   |                     |
| `aqua-secret`  | `string` | Aqua secret                                                                                                                                                                                         | `true`   |                     |
| `access-token` | `string` | GitHub access token, defaults to the CI token, if CI permissions are specified, use the `action: read` permission. If a custom access token is used, make sure to have the `repo: read` permissions | `true`   | `${{github.token}}` |
| `repo-path`    | `string` | Repository path                                                                                                                                                                                     | `false`  | `.`                 |
| `quiet`        | `bool`   | Quiet mode - Print only errors                                                                                                                                                                      | `false`  | `false`             |
| `verbose`      | `bool`   | Verbose mode - Print debug logs and above. In case both `quiet` and `verbose` are `true`, `quiet` will be applied                                                                                   | `false`  | `false`             |
| `log-file`     | `string` | Log file path                                                                                                                                                                                       | `false`  |                     |

---

Tracee is an [Aqua Security] open source project.
Learn about our open source work and portfolio [Here].
Join the community, and talk to us about any matter in [GitHub Discussion] or [Slack].

[aqua security]: https://aquasec.com
[github discussion]: https://github.com/aquasecurity/tracee/discussions
[slack]: https://slack.aquasec.com
[here]: https://www.aquasec.com/products/open-source-projects/
