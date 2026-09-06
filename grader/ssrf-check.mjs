#!/usr/bin/env node
// Assert the grader rejects private resolved addresses, not just hostname literals.
import { hostnameResolvesPublic, isPublicHost, normalizeUrl } from './worker.js';

let failed = 0;
function pass(msg) { console.log('  ✓ ' + msg); }
function fail(msg) { failed++; console.error('  ✗ ' + msg); }
function assert(cond, msg) { cond ? pass(msg) : fail(msg); }

console.log('== Grader public-host + DNS checks ==');
assert(isPublicHost('127.0.0.1') === false, 'loopback literal is rejected');
assert(isPublicHost('10.0.0.4') === false, 'RFC1918 literal is rejected');
assert(typeof hostnameResolvesPublic === 'function', 'hostnameResolvesPublic is exported');

const loopback = await hostnameResolvesPublic('internal.example', async () => ['127.0.0.1']);
assert(loopback === false, 'hostname that resolves to loopback is rejected');

const rfc1918 = await hostnameResolvesPublic('intranet.example', async () => ['10.1.2.3']);
assert(rfc1918 === false, 'hostname that resolves to RFC1918 is rejected');

const publicOk = await hostnameResolvesPublic('example.com', async () => ['93.184.216.34']);
assert(publicOk === true, 'hostname that resolves to a public A is accepted');

const mixed = await hostnameResolvesPublic('split.example', async () => ['93.184.216.34', '192.168.0.1']);
assert(mixed === false, 'hostname with any private A is rejected');

assert(normalizeUrl('https://127.0.0.1/') === null, 'normalizeUrl still rejects loopback URLs');

if (failed) {
  console.error('\nssrf-check FAILED — ' + failed + ' failure(s)');
  process.exit(1);
}
console.log('\nssrf-check PASSED');
