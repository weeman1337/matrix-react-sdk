/*
Copyright 2022 The Matrix.org Foundation C.I.C.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { MatrixEvent, RelationType, Room } from "matrix-js-sdk/src/matrix";

import {
    VoiceBroadcastInfoEventType,
    VoiceBroadcastInfoState,
} from "..";

const isMatchingInfoEvent = (
    event: MatrixEvent,
    deviceId?: string,
): boolean => {
    const state = event.getContent()?.state;
    return state && state !== VoiceBroadcastInfoState.Stopped
        && (!deviceId || event.getContent()?.device_id === deviceId);
};

export const findLiveBroadcastInfoInRoom = (
    room: Room,
    userId?: string,
    deviceId?: string,
): MatrixEvent | null => {
    const stateEvents = room.currentState.getStateEvents(VoiceBroadcastInfoEventType, userId);

    // nothing found
    if (!stateEvents) return null;

    let liveBroadcastInfoEvent: MatrixEvent | null = null;

    if (Array.isArray(stateEvents)) {
        liveBroadcastInfoEvent = stateEvents.find((event: MatrixEvent) => {
            return isMatchingInfoEvent(event, deviceId);
        });
    } else {
        liveBroadcastInfoEvent = isMatchingInfoEvent(stateEvents, deviceId)
            ? stateEvents
            : null;
    }

    // no live broadcast matching the criteria
    if (!liveBroadcastInfoEvent) return null;

    if (liveBroadcastInfoEvent.getContent()?.state === VoiceBroadcastInfoState.Started) {
        // this is the event identifying a voice broadcast; no need to query the relation
        return liveBroadcastInfoEvent;
    }

    const relation = liveBroadcastInfoEvent.getRelation();

    if (relation.rel_type !== RelationType.Reference || !relation.event_id) {
        // invalid relation
        return null;
    }

    // return the started voice broadcast info event
    return room.findEventById(relation.event_id) || null;
};
