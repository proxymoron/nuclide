'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import {observeProcess, safeSpawn} from '../../commons-node/process';
import {compact} from '../../commons-node/stream';
import featureConfig from '../../commons-atom/featureConfig';
import Rx from 'rxjs';

export function createProcessStream(): Rx.Observable<string> {
  return compact(
    observeProcess(spawnAdbLogcat)
      // Forward the event, but add the last line of std err too. We can use this later if the
      // process exits to provide more information.
      .scan(
        (acc, event) => {
          switch (event.kind) {
            case 'error':
              throw event.error;
            case 'exit':
              throw new Error(acc.lastError || '');
            case 'stdout':
              // Keep track of the last error so that we can show it to users if the process dies
              // badly. If we get a non-error message, then the last error we saw wasn't the one
              // that killed the process, so throw it away. Why is this not on stderr? I don't know.
              return {
                event,
                lastError: parseError(event.data),
              };
            case 'stderr':
              return {...acc, event};
            default:
              // This should never happen.
              throw new Error(`Invalid event kind: ${event.kind}`);
          }
        },
        {event: null, lastError: null},
      )
      .map(acc => acc.event),
  )

    // Only get the text from stdout.
    .filter(event => event.kind === 'stdout')
    .map(event => event.data && event.data.replace(/\r?\n$/, ''))

    // Skip the single historical log. Adb requires us to have at least one (`-T`) but (for now at
    // least) we only want to show live logs. Also, since we're automatically retrying, displaying
    // it would mean users would get an inexplicable old entry.
    .skip(1);
}

function spawnAdbLogcat(): Promise<child_process$ChildProcess> {
  return safeSpawn(
    ((featureConfig.get('nuclide-adb-logcat.pathToAdb'): any): string),
    ['logcat', '-v', 'long', '-T', '1'],
  );
}

function parseError(line: string): ?string {
  const match = line.match(/^ERROR:\s*(.*)/);
  return match == null ? null : match[1].trim();
}
