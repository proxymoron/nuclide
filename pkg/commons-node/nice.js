'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import type {LRUCache} from 'lru-cache';

import LRU from 'lru-cache';

import {safeSpawn} from './process';
import which from './which';

const NICE_COMMAND = 'nice';

export default async function nice(
  command: string,
  args: Array<string>,
  execOptions?: Object,
): Promise<child_process$ChildProcess> {
  const fullArgs = [command, ...args];
  // TODO use ionice too if available
  if (await hasNiceCommand()) {
    fullArgs.unshift(NICE_COMMAND);
  }
  return safeSpawn(fullArgs[0], fullArgs.slice(1), execOptions);
}

const commandAvailabilityCache: LRUCache<string, boolean> = LRU({
  max: 10,
  // Realistically this will not change very often so we can cache for long periods of time. We
  // probably could just check at startup and get away with it, but maybe someone will install
  // `ionice` and it would be nice to pick that up.
  maxAge: 1000 * 60 * 5, // 5 minutes
});

function hasNiceCommand(): Promise<boolean> {
  return hasCommand(NICE_COMMAND);
}

async function hasCommand(command: string): Promise<boolean> {
  let result: ?boolean = commandAvailabilityCache.get(command);
  if (result == null) {
    result = await which(command) != null;
    commandAvailabilityCache.set(command, result);
  }
  return result;
}
