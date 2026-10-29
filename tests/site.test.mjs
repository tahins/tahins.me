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

const HOME_PROJECT_ORDER = [
  'Todox',
  'Alaap SMS',
  'getbriefly',
  'HajjMate',
  'Quran Map',
  'Dua Deck',
  'Guided Verses',
];

test('home current-work cards are Todox, Alaap SMS, getbriefly, HajjMate, Quran Map, Dua Deck, Guided Verses', () => {
  assert.deepEqual(
    currentProjects.map((project) => project.title),
    HOME_PROJECT_ORDER,
  );
});

test('current work uses Tahin-supplied links and leaves HajjMate without a URL', () => {
  const byTitle = Object.fromEntries(currentProjects.map((project) => [project.title, project]));
  assert.equal(byTitle.Todox.url, 'https://todox.tahins.me/');
  assert.equal(byTitle.getbriefly.title, 'getbriefly');
  assert.equal(
    currentProjects.find((project) => project.title === 'GetBriefly'),
    undefined,
  );
  assert.equal(byTitle.getbriefly.url, 'https://getbriefly.news/');
  assert.equal(byTitle['Quran Map'].url, 'https://quran-map.tahins.me/');
  assert.equal(byTitle.HajjMate.url, undefined);
  assert.equal(byTitle.HajjMate.githubUrl, undefined);
  assert.equal(byTitle['Alaap SMS'].url, 'https://alaap.tahins.me/');
  assert.equal(
    currentProjects.find((project) => project.title === 'Alaap'),
    undefined,
  );
  assert.equal(byTitle['Dua Deck'].url, 'https://dua-deck.tahins.me/');
  assert.equal(byTitle['Guided Verses'].url, 'https://app.guidedverses.xyz/');
  assert.ok(currentProjects.every((project) => !project.githubUrl));
  assert.ok(currentProjects.every((project) => !project.url || project.url.startsWith('https://')));
});

test('current work uses Tahin taglines and site wording', () => {
  const byTitle = Object.fromEntries(currentProjects.map((project) => [project.title, project]));
  assert.equal(
    byTitle.Todox.description,
    'A minimal to-do app built for the busiest person on the earth.',
  );
  assert.equal(byTitle.getbriefly.description, 'Your personal Bengali news, briefly.');
  assert.equal(byTitle.HajjMate.description, 'A Hajj and Umrah companion app for pilgrims.');
  assert.equal(byTitle['Quran Map'].description, 'A calm companion for Quran memorization.');
  assert.equal(byTitle['Alaap SMS'].description, 'A privacy-first SMS app for Android.');
  assert.match(byTitle['Dua Deck'].description, /tranquil and artistic Dua companion/i);
  assert.match(byTitle['Guided Verses'].description, /friendly reading experience/i);
});
