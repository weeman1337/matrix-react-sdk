/*
Copyright 2015-2024 The Matrix.org Foundation C.I.C.

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

import React, { useMemo, useState } from "react";
import { Direction, Room } from "matrix-js-sdk/src/matrix";
import { Alert, Button, H1, H3, Link } from "@vector-im/compound-web";

import { MatrixClientPeg } from "../../MatrixClientPeg";
import { useWidgets } from "../views/right_panel/RoomSummaryCard";
import AppTile from "../views/elements/AppTile";
import MatrixClientContext from "../../contexts/MatrixClientContext";
import defaultDispatcher from "../../dispatcher/dispatcher";
import { OpenToTabPayload } from "../../dispatcher/payloads/OpenToTabPayload";
import { Action } from "../../dispatcher/actions";
import Modal from "../../Modal";
import LogoutDialog from "../views/dialogs/LogoutDialog";
import { SdkContextClass } from "../../contexts/SDKContext";

type BoardsListProps = {
    onRoomSelect: (room: Room) => void;
};

const BoardsList: React.FC<BoardsListProps> = ({ onRoomSelect }) => {
    const client = MatrixClientPeg.safeGet();

    const neoBoardRooms = useMemo(() => {
        const rooms = client.getRooms();
        return rooms.filter((room) => {
            return room.getLiveTimeline().getState(Direction.Forward)?.events.has("net.nordeck.whiteboard");
        });
    }, [client]);

    const boardItems = neoBoardRooms.map((neoBoardRoom) => {
        return (
            <div
                className="nb-list-item"
                key={neoBoardRoom.roomId}
                onClick={() => {
                    onRoomSelect(neoBoardRoom);
                }}
            >
                {neoBoardRoom.name}
            </div>
        );
    });

    const handleOpenSettingsClick = (): void => {
        const payload: OpenToTabPayload = { action: Action.ViewUserSettings };
        defaultDispatcher.dispatch(payload);
    };

    return (
        <div>
            <H3>Choose a board to start</H3>
            <div className="nb-list">{boardItems}</div>
            <H3>Other</H3>
            <div style={{ display: "inline-flex", gap: "8px" }}>
                <Button onClick={handleOpenSettingsClick}>Open settings</Button>
                <Button kind="destructive" onClick={() => Modal.createDialog(LogoutDialog)}>
                    Sign out
                </Button>
            </div>
        </div>
    );
};

type BoardProps = {
    room: Room;
    onBackClick: () => void;
};

const Board: React.FC<BoardProps> = ({ onBackClick, room }) => {
    const apps = useWidgets(room);
    const neoBoard = useMemo(
        () => apps.find((app) => app.eventId !== undefined && app.type === "net.nordeck.whiteboard:pad"),
        [apps],
    );

    if (!neoBoard) {
        return (
            <div>
                <Alert type="critical" title="Error">
                    <Link onClick={onBackClick}>Go back to list</Link>
                    and try another board
                </Alert>
            </div>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", flexGrow: "1" }}>
            <div>
                <Link onClick={onBackClick}>back to list</Link>
            </div>
            <H3>{room.name}</H3>
            <AppTile
                key={neoBoard.id}
                app={neoBoard}
                room={room}
                userId={MatrixClientPeg.safeGet().getUserId()!}
                creatorUserId={neoBoard.creatorUserId}
                userWidget={true}
                style={{ flexGrow: "1" }}
            />
        </div>
    );
};

export const BoardsView: React.FC = () => {
    const [activeBoardRoom, setActiveBoardRoom] = useState<Room | undefined>();

    const handleRoomSelect = (room: Room): void => {
        SdkContextClass.instance.roomViewStore.setRoomId(room.roomId);
        setActiveBoardRoom(room);
    };

    return (
        <MatrixClientContext.Provider value={MatrixClientPeg.safeGet()}>
            <div className="nb-container">
                <H1>NeoBoard react-sdk demo</H1>
                {activeBoardRoom ? (
                    <Board onBackClick={() => setActiveBoardRoom(undefined)} room={activeBoardRoom} />
                ) : (
                    <BoardsList onRoomSelect={handleRoomSelect} />
                )}
            </div>
        </MatrixClientContext.Provider>
    );
};
