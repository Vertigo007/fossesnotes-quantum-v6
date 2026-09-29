// Tiny JSON-file store. One user, a few hundred listings: a database server
// would be overkill. Writes are serialised and atomic (tmp file + rename).

import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export const newId = (prefix) => `${prefix}_${crypto.randomBytes(8).toString('hex')}`;

export class Store {
  constructor(file) {
    this.file = file;
    this.data = { listings: [], actions: [], sessions: [] };
    this.queue = Promise.resolve();
  }

  async load() {
    await fs.mkdir(path.dirname(this.file), { recursive: true });
    try {
      const raw = await fs.readFile(this.file, 'utf8');
      this.data = { listings: [], actions: [], sessions: [], ...JSON.parse(raw) };
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
      await this.save();
    }
    return this;
  }

  save() {
    const snapshot = JSON.stringify(this.data, null, 2);
    this.queue = this.queue.then(async () => {
      const tmp = `${this.file}.${process.pid}.tmp`;
      await fs.writeFile(tmp, snapshot);
      await fs.rename(tmp, this.file);
    });
    return this.queue;
  }

  list(collection, predicate = () => true) {
    return this.data[collection].filter(predicate);
  }

  get(collection, id) {
    return this.data[collection].find((x) => x.id === id) || null;
  }

  async insert(collection, doc) {
    this.data[collection].push(doc);
    await this.save();
    return doc;
  }

  async update(collection, id, patch) {
    const idx = this.data[collection].findIndex((x) => x.id === id);
    if (idx === -1) return null;
    const next = typeof patch === 'function' ? patch(this.data[collection][idx]) : { ...this.data[collection][idx], ...patch };
    this.data[collection][idx] = { ...next, updatedAt: new Date().toISOString() };
    await this.save();
    return this.data[collection][idx];
  }

  async remove(collection, id) {
    const before = this.data[collection].length;
    this.data[collection] = this.data[collection].filter((x) => x.id !== id);
    if (this.data[collection].length !== before) await this.save();
    return before !== this.data[collection].length;
  }
}
