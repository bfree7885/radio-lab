# Official exam sources

Official exam data is reference and alignment data. Radio Lab curriculum is the teaching layer. A question stored for traceability is not a lesson, and Radio Lab does not teach by memorizing its answer.

## Where sources live

Each license level can have its own directory under `content/exam/sources/`. Technician uses:

`content/exam/sources/technician-2026-2030/`

That directory holds `provenance.json` and, on a development machine, the local NCVEC PDF. The PDF is listed in `.gitignore`. It is not in the git repository and it is not copied into the hosted learner site. General is not imported. When it is, it gets its own directory, its own local NCVEC file, and its own errata date. It does not reuse the Technician file.

The Technician source is the NCVEC Question Pool Committee 2026–2030 Technician Class pool, FCC Element 2, February 19, 2026 release. It is effective July 1, 2026 through June 30, 2030. It supersedes the December 18, 2025 public release for Radio Lab.

NCVEC states, on the release page: "The NCVEC Question Pool Committee (QPC) hereby releases the 2026-2030 Technician Class (Element 2) Question Pool into the public domain."

The page where that source can be obtained is:

https://ncvec.org/index.php/2026-2030-technician-question-pool

## Provenance

`provenance.json` records the organization, license level, FCC element, pool id, effective date, expiration date, errata release, source page, source URL, retrieval date, original filename, local filename, and SHA-256 checksum. `authoritative` is true only for that NCVEC file.

The checksum is the SHA-256 of the local PDF bytes:

```bash
sha256sum "content/exam/sources/technician-2026-2030/2026-2030-technician-ncvec-feb-19-2026.pdf"
```

The PDF is not edited after download. If the checksum changes, the file is no longer the recorded source.

## How the structured files are derived

`labs/ncvec_extract.py` reads the PDF with `pdftotext -layout` and writes:

- `content/exam/technician-2026-2030.json` — official subelements and groups, including the official topic text for each group
- `content/exam/technician-2026-2030-questions.json` — official question ids, group ids, and stems

The extractor refuses to write those files unless the PDF contains the February 19, 2026 errata page and the corrected stems for T1C01, T5A05, T7A09, and T0A10. It does not copy answer letters or choice lists.

Regenerate after replacing the PDF:

```bash
.venv/bin/python -m labs.ncvec_extract
```

## What Radio Lab keeps separate

| Layer | File | What it is |
| --- | --- | --- |
| Authoritative source | NCVEC release page, plus a local ignored PDF and `provenance.json` | February 19, 2026 Technician Class / Element 2 pool. Public domain. The PDF is not in git. |
| Official syllabus | `content/exam/technician-2026-2030.json` | Group topic text derived from that PDF |
| Official question metadata | `content/exam/technician-2026-2030-questions.json` | Ids and stems for traceability. No answer key |
| Radio Lab alignment | lesson `alignment` blocks | Which labs relate to which group ids |
| Radio Lab teaching | `content/labs/` and `content/curriculum.json` | What the learner actually does |
| Coverage audit | not produced by this import | A later comparison of teaching against the official topic text |

`content/exam/model.json` points at the Technician source, syllabus, and question index. `questionsImported` stays false because the official answer key is not loaded. Exam Readiness uses original Radio Lab questions in `content/exam/technician-readiness-v1.json`. Official stem ids on those questions are alignment only. `questionIdsIndexed` means the ids and stems exist for traceability.

The local app serves JSON under `/content/`. It does not serve the PDF. No learning screen lists official answers.
