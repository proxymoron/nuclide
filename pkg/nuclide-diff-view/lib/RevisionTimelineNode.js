'use babel';
/* @flow */

/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 */

import type {RevisionInfo} from '../../nuclide-hg-rpc/lib/HgService';
import type {DiffStatusDisplay} from './types';

import classnames from 'classnames';
import {getPhabricatorRevisionFromCommitMessage} from '../../nuclide-arcanist-rpc/lib/utils';
import {getCommitAuthorFromAuthorEmail} from '../../nuclide-arcanist-rpc/lib/utils';
import {React} from 'react-for-atom';
import {track} from '../../nuclide-analytics';

type RevisionTimelineNodeProps = {
  diffStatus: ?DiffStatusDisplay,
  index: number,
  onSelectionChange: (revisionInfo: RevisionInfo) => any,
  revision: RevisionInfo,
  revisionsCount: number,
  selectedIndex: number,
};

export default class RevisionTimelineNode extends React.Component {
  props: RevisionTimelineNodeProps;

  constructor(props: RevisionTimelineNodeProps) {
    super(props);
    (this: any)._handlePhabricatorRevisionClick = this._handlePhabricatorRevisionClick.bind(this);
    (this: any)._handleSelectionChange = this._handleSelectionChange.bind(this);
  }

  _handlePhabricatorRevisionClick(event: SyntheticMouseEvent): void {
    // Clicking an anchor opens the `href` in the browser. Stop propagation so it doesn't affect
    // the node selection in the Timeline.
    event.stopPropagation();

    const revision = getPhabricatorRevisionFromCommitMessage(this.props.revision.description);
    track('diff-view-phabricator-diff-open', {revision});
  }

  _handleSelectionChange(): void {
    this.props.onSelectionChange(this.props.revision);
  }

  render(): React.Element<any> {
    const {diffStatus, index, revision, revisionsCount, selectedIndex} = this.props;
    const {author, bookmarks, date, description, hash, title} = revision;
    const revisionClassName = classnames('revision revision--actionable', {
      'selected-revision-inrange': index < selectedIndex,
      'selected-revision-end': index === selectedIndex,
      'selected-revision-last': index === revisionsCount - 1,
    });
    const tooltip = `${hash}: ${title}
  Author: ${author}
  Date: ${date.toString()}`;

    const commitAuthor = getCommitAuthorFromAuthorEmail(author);
    let commitAuthorElement;
    if (commitAuthor != null) {
      commitAuthorElement = (
        <span className="inline-block">{commitAuthor}</span>
      );
    }

    const phabricatorRevision = getPhabricatorRevisionFromCommitMessage(description);
    let phabricatorRevisionElement;
    if (phabricatorRevision != null) {
      phabricatorRevisionElement = (
        <a
          className="inline-block"
          href={phabricatorRevision.url}
          onClick={this._handlePhabricatorRevisionClick}>
          <strong>{phabricatorRevision.name}</strong>
        </a>
      );
    }

    let diffStatusElement;
    if (diffStatus != null) {
      diffStatusElement = (
        <span className={classnames('inline-block', diffStatus.className)}>
          {diffStatus.name}
        </span>
      );
    }

    let associatedExtraElement;
    try {
      // $FlowFB
      const diffUtils = require('../../nuclide-diff-view/lib/fb/utils.js');
      const taskIds = diffUtils.getFbCommitTaskInfoFromCommitMessage(description);
      associatedExtraElement = taskIds.map(task => {
        return (
          <a key={task.id} className="inline-block" href={task.url}>{task.name}</a>
        );
      });
    } catch (ex) {
      // There are no extra UI elements to show.
    }

    const bookmarksToRender = bookmarks.slice();
    if (index === 0 && revisionsCount > 1 && bookmarks.length === 0) {
      bookmarksToRender.push('HEAD');
    }
    if (index === revisionsCount - 1 && bookmarks.length === 0) {
      bookmarksToRender.push('BASE');
    }

    let bookmarksElement;
    if (bookmarksToRender.length > 0) {
      bookmarksElement = (
        <span className="inline-block text-success">
          {bookmarksToRender.join(' ')}
        </span>
      );
    }

    return (
      <div
        className={revisionClassName}
        onClick={this._handleSelectionChange}
        title={tooltip}>
        <div className="revision-bubble" />
        <div className="revision-label text-monospace">
          <span className="inline-block">{hash.substr(0, 7)}</span>
          {commitAuthorElement}
          {phabricatorRevisionElement}
          {diffStatusElement}
          {associatedExtraElement}
          {bookmarksElement}
          <br />
          <span className="revision-title">
            {title}
          </span>
        </div>
      </div>
    );
  }
}
