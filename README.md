# Tracee Commercial Action

This action generates a profile of your workflow job, using Aqua's Tracee.
The profile is used to provide visibility, and policing of your workflow jobs, and allows you to enforce policies from Aqua platform.
To use this action, you need to have an Aqua account, and generate aqua key and secret from Aqua platform.

---

## Table of Contents

- [Usage](#usage)
- [Inputs](#inputs)

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

| Name           | type     | description                                                                | required | default |
| -------------- | -------- | -------------------------------------------------------------------------- | -------- | ------- |
| `aqua-key`     | `string` | Aqua key                                                                   | `true`   |         |
| `aqua-secret`  | `string` | Aqua secret                                                                | `true`   |         |
| `access-token` | `string` | GitHub access token, use default `secrets.GITHUB_TOKEN` with `permissions` | `true`   |         |
| `repo-path`    | `string` | Repository path                                                            | `false`  | `.`     |
