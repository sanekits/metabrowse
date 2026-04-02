# Metabrowse Issues Checklist


- [ ] **2. mktree missing intermediate-directory READMEs** — `metabrowse-wiz.sh mktree` does not create README.md files for intermediate directories. For example, `mktree foo/{bar1,bar2}` creates READMEs for `bar1` and `bar2` but not for the parent `foo/`.


- [ ] **6. Support page titles via `# Title` in README.md** — Currently, a `# Title` heading in a README.md is not used as the page title. Add a mechanism to extract a leading `# Title` line and use it as the HTML page title and breadcrumb label.
