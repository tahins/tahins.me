import test from 'node:test';
import assert from 'node:assert/strict';
import { contacts, currentProjects, navLinks, site } from '../src/data/site.js';

test('title and hero copy use Staff Software Engineer, not Head of Engineering', () => {
  assert.match(site.title, /Staff Software Engineer/);
  assert.doesNotMatch(site.title, /Head of Engineering/);
  assert.match(site.description, /Staff Software Engineer/);
  assert.doesNotMatch(site.description, /Head of Engineering/);
});

test('nav is Projects, Blog, Profile, Contact', () => {
  assert.deepEqual(
    navLinks.map((link) => link.text),
    ['projects', 'blog', 'profile', 'contact'],
  );
  assert.equal(navLinks.find((link) => link.text === 'blog').url, '/blog/');
});

test('contact list starts with email and has no Medium', () => {
  assert.equal(contacts[0].text, 'Email');
  assert.equal(
    contacts.find((contact) => /medium/i.test(contact.text) || /medium/i.test(contact.url)),
    undefined,
  );
});

test('current work does not invent missing URLs', () => {
  const untitled = currentProjects.filter((project) =>
    ['Todox', 'GetBriefly', 'HajjMate', 'Quran Map'].includes(project.title),
  );
  assert.equal(untitled.length, 4);
  for (const project of untitled) {
    assert.equal(project.url, undefined);
    assert.equal(project.githubUrl, undefined);
  }
  assert.equal(
    currentProjects.find((project) => project.title === 'Alaap').url,
    'https://alaap.tahins.me/',
  );
  assert.equal(
    currentProjects.find((project) => project.title === 'Guided Verses').url,
    'https://app.guidedverses.xyz/',
  );
});
