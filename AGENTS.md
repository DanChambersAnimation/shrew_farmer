# Project agent instructions

Follow the global agent instructions and this project's `CLAUDE.md`. See `README.md` for the project layout and local development commands.

## GitHub issues

Use the upstream repository, `DanChambersAnimation/shrew_farmer`, as the issue tracker. The `fork` Git remote is for contributions, not a separate backlog. Existing gambit issues are [#2](https://github.com/DanChambersAnimation/shrew_farmer/issues/2) (visual icons) and [#3](https://github.com/DanChambersAnimation/shrew_farmer/issues/3) (crowd simulation).

- Record new ideas, bugs, and follow-up work as issues when the user asks to register them or when a task leaves a concrete follow-up. Search open and closed issues first; add to an existing issue when it already covers the work.
- Keep each issue focused on one independently deliverable outcome. Separate visual design from simulation behavior when they can be built and reviewed independently.
- Give the issue a specific title and a short body covering the goal, proposed behavior or scope, and checkable acceptance criteria. Include links to related issues and relevant rooms or files. Mark undecided mechanics as open questions rather than presenting them as decisions.
- During implementation, link the branch or pull request to the issue. Use `Closes #N` only when the delivered work meets its acceptance criteria; otherwise use `Refs #N`. Update the issue when a design decision changes its scope, and close it only when the work is delivered or explicitly cancelled.
- Prefer the connected GitHub tools. If they cannot write issues, use the authenticated `gh` CLI with `--repo DanChambersAnimation/shrew_farmer`. For a multiline issue body, write a Markdown file and pass it with `--body-file`.
- Creating or updating an issue does not pause work the user has already authorized. Do not put secrets or private user data in public issues.
