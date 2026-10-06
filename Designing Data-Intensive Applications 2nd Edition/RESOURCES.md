# Designing Data-Intensive Applications Resources

## Knowledge

- Book: _Designing Data-Intensive Applications_, 2nd edition — Martin Kleppmann & Chris Riccomini (O'Reilly, Feb 2026). Local PDF: `Obsidian Personal/03_Resources/Books & Reading/Designing Data-Intensive Applications 2nd Edition (Martin Kleppmann, Chris Riccomini).pdf` (book page = PDF page − 24).
  Primary source for every lesson. Use for: everything. Each chapter ends with a reference list — most items free online.
- [dataintensive.net](https://dataintensive.net/) — official book site.
  Use for: errata, chapter references.

### Ch.1 · Trade-offs in data systems architecture
- [Paper: "Scalability! But at What COST?" — McSherry, Isard, Murray, HotOS 2015](https://www.usenix.org/system/files/conference/hotos15/hotos15-paper-mcsherry.pdf)
  Use for: single-node vs distributed; one thread can beat a cluster.
- [Blog: "Data Lake" — Martin Fowler, 2015](https://martinfowler.com/bliki/DataLake.html)
  Use for: lake vs warehouse.
- [Blog: "Datensparsamkeit" — Martin Fowler, 2013](https://martinfowler.com/bliki/Datensparsamkeit.html)
  Use for: data minimization.
- [Blog: "Why We're Leaving the Cloud" — David Heinemeier Hansson, 2022](https://world.hey.com/dhh/why-we-re-leaving-the-cloud-654b47e0)
  Use for: the self-hosting side of the cloud cost debate.
- Book: _Site Reliability Engineering_ — Beyer et al. (O'Reilly, 2016), free at [sre.google/books](https://sre.google/books/).
  Use for: DevOps/SRE operations; cascading failures (also Ch.2).

### Ch.2 · Defining nonfunctional requirements
- [Paper: "The Tail at Scale" — Dean & Barroso, CACM 2013](https://cacm.acm.org/research/the-tail-at-scale/)
  Short, classic. Use for: percentiles, tail latency amplification, hedged requests.
- [Talk: "Timelines at Scale" — Raffi Krikorian, QCon SF 2012](https://www.infoq.com/presentations/Twitter-Timeline-Scalability/)
  Use for: origin of the home-timeline / fan-out story.
- [Blog: "Exponential Backoff and Jitter" — Marc Brooker, AWS, 2015](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)
  Use for: retry storms, backoff.
- Paper: "Metastable Failures in Distributed Systems" — Bronson et al., HotOS 2021 (search title).
  Use for: overloaded systems that don't recover.
- [Paper: "Why Do Internet Services Fail…?" — Oppenheimer, Ganapathi, Patterson, USITS 2003](https://www.usenix.org/legacy/events/usits03/tech/full_papers/oppenheimer/oppenheimer.pdf)
  Use for: config changes as top outage cause.
- [Blog: "Blameless PostMortems and a Just Culture" — John Allspaw, Etsy, 2012](https://www.etsy.com/codeascraft/blameless-postmortems/)
  Use for: human factors, incident reviews.
- [Essay: "How Complex Systems Fail" — Richard Cook](https://how.complexsystems.fail/)
  5-minute read. Use for: reliability mindset, incidents.
- Essay: "No Silver Bullet — Essence and Accident in Software Engineering" — Fred Brooks (in _The Mythical Man-Month_, 1995).
  Use for: essential vs accidental complexity (the 2nd ed.'s citation).
- [Paper: "Out of the Tar Pit" — Moseley & Marks, 2006](https://curtclifton.net/papers/MoseleyMarks06a.pdf)
  Optional extra (cited in 1st ed., not 2nd). Use for: deeper take on accidental complexity.

## Wisdom (Communities)

- Not yet chosen. Ask learner whether they want one (e.g. an internal BINUS IT reading group, or an online DDIA book club).

## Gaps

- None for source text. Chapter reference lists in the PDF are the go-to for deeper reading per lesson.
