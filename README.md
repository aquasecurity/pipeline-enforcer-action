# Pipeline Enforcer Action

The Pipeline Enforcer Action protects GitHub workflows by generating an activity profile of the workflow job using Aqua Security's [Tracee](https://github.com/aquasecurity/tracee). This action allows gaining both visibility of the workflow jobs activity, and to policies enforcement over the Aqua platform. To use this action, it is required to have an Aqua account in addition to a key and a secret generated over the platform.

Open source version of this action is available [here](https://github.com/aquasecurity/tracee-action).

---

## Table of Contents

- [Pipeline Enforcer Action](#pipeline-enforcer-action)
  - [Table of Contents](#table-of-contents)
  - [Threats Protection](#threats-protection)
  - [Protection Methods](#protection-methods)
    - [Activity Profiling](#activity-profiling)
    - [Suspicious Behavior Detection](#suspicious-behavior-detection)
  - [Usage](#usage)
    - [Profile your workflow job](#profile-your-workflow-job)
    - [If the repository is cloned in a different folder](#if-the-repository-is-cloned-in-a-different-folder)
    - [If the workflow is executed by a reusable workflow with matrix strategy](#if-the-workflow-is-executed-by-a-reusable-workflow-with-matrix-strategy)
      - [Imported Workflow](#imported-workflow)
      - [Importing Workflow](#importing-workflow)
  - [Inputs](#inputs)

---

## Threats Protection

By using this action, you protect your workflow jobs from the following threats:

|     | Threat                | Description                                                                                                                                         | Examples                                                                                                                           |
| --- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 1.  | Secrets exfiltration  | Malicious packages or pipeline dependencies stealing secrets by making a network call using pipeline secrets                                        | [Codecov breach](https://blog.aquasec.com/codecovs-breach-supply-chain-attack)                                                     |
| 2.  | Source code tampering | Malicious dependencies or compromised runner editing source code before the artifact is being built to inject a backdoor or insert a malicious code | [Solarwinds incident](https://www.aquasec.com/cloud-native-academy/supply-chain-security/solarwinds-attack/)                       |
| 3.  | Compromised Runner    | A breached runner running a malware or a crypto miner                                                                                               | [Crypto mining in the CI](https://blog.aquasec.com/container-security-alert-campaign-abusing-github-dockerhub-travis-ci-circle-ci) |

---

## Protection Methods

The protection is being made by 2 main components. All the data is being sent to Aqua platform, and is being used to enforce policies.

### Activity Profiling

Protection is done by having an ongoing Activity Profiling and a Suspicions Behavior Detection. This requires sending all data through the Aqua platform for analysis and to enforce policies.

1. Network calls - a list of all the network calls made during the pipeline execution.
2. Repository filesystem changes - a list of all the changes that are made inside the repository file system (source code, package managers etc.) during the pipeline execution.
3. Containers executions - a list of all the containers that were executed during the pipeline execution.
4. Process executions - a list of all the processes that were executed during the pipeline execution.

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
      - name: Pipeline Enforcer
        uses: aquasecurity/pipeline-enforcer-action@v1.0.0
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
    - name: Pipeline Enforcer
      uses: aquasecurity/pipeline-enforcer-action@v1.0.0
      with:
        aqua-key: ${{ secrets.AQUA_KEY }}
        aqua-secret: ${{ secrets.AQUA_SECRET }}
        access-token: ${{ secrets.GITHUB_TOKEN }}
        repo-path: my-repo
    - ...
```

### If the workflow is executed by a reusable workflow with matrix strategy

#### Imported Workflow

```yaml
name: Imported
on:
  workflow_call:
    inputs:
      matrix:
        type: string
        required: false

  jobs:
    build:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v2
        - name: Pipeline Enforcer
          uses: aquasecurity/pipeline-enforcer-action@v1.0.0
          with:
            aqua-key: ${{ secrets.AQUA_KEY }}
            aqua-secret: ${{ secrets.AQUA_SECRET }}
            access-token: ${{ secrets.GITHUB_TOKEN }}
            matrix: ${{ inputs.matrix || toJSON(matrix) }}
```

#### Importing Workflow

```yaml
name: Build
on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        type: [1, 2]
    uses: ./.github/workflows/imported.yml@main
    with:
      matrix: ${{ toJSON(matrix) }}
```

---

## Inputs

| Name           | type     | description                                                                                                                                                                                         | required | default               |
| -------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------------- |
| `aqua-key`     | `string` | Aqua key                                                                                                                                                                                            | `true`   |                       |
| `aqua-secret`  | `string` | Aqua secret                                                                                                                                                                                         | `true`   |                       |
| `access-token` | `string` | GitHub access token, defaults to the CI token, if CI permissions are specified, use the `action: read` permission. If a custom access token is used, make sure to have the `repo: read` permissions | `true`   | `${{github.token}}`   |
| `repo-path`    | `string` | Repository path                                                                                                                                                                                     | `false`  | `.`                   |
| `quiet`        | `bool`   | Quiet mode - Print only errors                                                                                                                                                                      | `false`  | `false`               |
| `verbose`      | `bool`   | Verbose mode - Print debug logs and above. In case both `quiet` and `verbose` are `true`, `quiet` will be applied                                                                                   | `false`  | `false`               |
| `log-file`     | `string` | Log file path                                                                                                                                                                                       | `false`  |                       |
| `matrix`       | `string` | GitHub matrix strategy affects the name of the job. The matrix context is required if the action is executed by a reusable workflow using workflow_call trigger combined with matrix strategy.      | `false`  | `${{toJSON(matrix)}}` |

---

Tracee is an [Aqua Security] open source project.
Learn about our open source work and portfolio [here].
Join the community, and talk to us about any matter in [GitHub Discussion] or [Slack].

[aqua security]: https://aquasec.com
[github discussion]: https://github.com/aquasecurity/tracee/discussions
[slack]: https://slack.aquasec.com
[here]: https://www.aquasec.com/products/open-source-projects/
