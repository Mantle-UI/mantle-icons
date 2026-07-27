# Releasing Mantle Icons

Releases are started manually from the `Release` GitHub Actions workflow on `main`.

The workflow determines the next version from merged pull requests since the
latest Mantle release tag:

- `breaking-change` label: major
- linked issue type `feature`: minor
- linked issue type `bug`: patch

Mantle Icons continues from the upstream `7.0.0` tag. The first automated
Mantle release therefore calculates the next version from changes merged after
that tag.

Before the first release, configure:

- repository variable `RELEASE_ALLOWED_ACTORS`
- repository variable `RELEASE_APP_CLIENT_ID`
- repository secret `RELEASE_APP_PRIVATE_KEY`
- protected `release` environment
- GitHub App with repository contents write access and ruleset bypass access
- npm Trusted Publisher for `@mantle-ui/icons` and this repository workflow

Publishing runs from the `Publish to npm` workflow after a GitHub Release is
published. It uses npm provenance and does not require a stored npm token.
