# Roadmap: DDIA (2nd edition)

Short lessons in reading order. Tick a lesson when it is built.

## Ch.1 Trade-Offs in Data Systems Architecture
- [x] 0001 operational-vs-analytical-systems — data-intensive apps, OLTP vs OLAP, why a separate warehouse
- [x] 0002 warehouses-lakes-and-derived-data — ETL/ELT, data lakes, HTAP, reverse ETL, system of record vs derived data
- [x] 0003 cloud-vs-self-hosting — build/buy spectrum, when cloud or self-hosting wins, cloud native storage/compute separation
- [x] 0004 distributed-vs-single-node — nine reasons to distribute, its costs, microservices, serverless, HPC
- [x] 0005 data-law-and-society — right to be forgotten, true cost of storing data, data minimization

## Ch.2 Defining Nonfunctional Requirements
- [x] 0006 home-timelines-case-study — functional vs nonfunctional, fan-out, materialized timelines, celebrities
- [x] 0007 response-time-and-overload — response time vs throughput, queueing, retry storms, timing vocabulary
- [x] 0008 percentiles-and-tail-latency — percentiles, SLO/SLA, tail latency amplification, combining histograms
- [x] 0009 faults-and-reliability — fault vs failure, fault tolerance, hardware/software/human faults, blameless culture
- [x] 0010 scalability — describing load, linear scalability, shared-memory/disk/nothing, scaling principles
- [x] 0011 maintainability — operability, simplicity (abstraction), evolvability (irreversibility)

## Ch.3 Data Models and Query Languages
- [x] 0012 data-models-and-orms — layered models, declarative queries, relational/NoSQL history, ORMs, N+1
- [x] 0013 documents-normalization-and-joins — one-to-many trees, normalized vs denormalized, hydrating IDs
- [x] 0014 document-vs-relational — relationship shapes, join tables, schema-on-read vs on-write, locality
- [x] 0015 star-schemas-and-dataframes — fact/dimension tables, star/snowflake/OBT, DataFrames, matrices
- [x] 0016 graph-data-models — property graphs, Cypher vs recursive SQL, triple stores, Datalog, GraphQL
- [x] 0017 event-sourcing-and-cqrs — commands vs events, derived views, benefits and pitfalls

## Ch.4 Storage and Retrieval
- [x] 0018 logs-indexes-and-sstables — append-only log, index cost, hash indexes, SSTables and sparse indexes
- [x] 0019 lsm-trees-and-bloom-filters — memtable, flush, compaction, tombstones, Bloom filters, compaction strategies
- [x] 0020 b-trees — pages, branching factor, page splits, WAL, B-tree variants
- [x] 0021 b-trees-vs-lsm-trees — read/write trade-offs, write amplification, sequential writes on SSDs
- [x] 0022 secondary-indexes-and-in-memory-databases — secondary/clustered/heap/covering indexes, in-memory and embedded engines
- [x] 0023 column-oriented-storage — unbundled warehouse stack, column stores, bitmap/RLE compression, sort order
- [x] 0024 query-execution-and-data-cubes — query compilation vs vectorized execution, materialized views, data cubes
- [x] 0025 search-indexes — concatenated and spatial indexes, inverted indexes, vector embeddings and indexes

## Planned (split to be decided when the learner starts each chapter)
- [ ] Ch.5 Encoding and Evolution
- [ ] Ch.6 Replication
- [ ] Ch.7 Sharding
- [ ] Ch.8 Transactions
- [ ] Ch.9 The Trouble with Distributed Systems
- [ ] Ch.10 Consistency and Consensus
- [ ] Ch.11 Batch Processing
- [ ] Ch.12 Stream Processing
- [ ] Ch.13 A Philosophy of Streaming Systems
- [ ] Ch.14 Doing the Right Thing
