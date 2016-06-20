'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import {loadServicesConfig} from '../../nuclide-rpc';
import nuclideUri from '../../nuclide-remote-uri';

export default loadServicesConfig(nuclideUri.join(__dirname, '..'));
