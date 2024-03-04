import {
    useBroadcastEvent,
    useEventListener,
    useMyPresence,
    useOthers,
} from "@/liveblocks.config";
import LiveCursors from "../cursor/LiveCursors";
import { useCallback, useEffect, useState } from "react";
import CursorChat from "../cursor/CursorChat";
import { CursorMode, CursorState, Reaction, ReactionEvent } from "@/types/type";
import ReactionSelector from "../reaction/ReactionButton";
import FlyingReaction from "../reaction/FlyingReaction";
import useInterval from "@/hooks/useInterval";
import { Comments } from "../comments/Comments";

import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { shortcuts } from "@/constants";

type Props = {
    canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
    undo: () => {};
    redo: () => {};
};

const Live = ({ canvasRef, undo, redo }: Props) => {
    const others = useOthers();
    const [{ cursor }, updateMyPresence] = useMyPresence() as any;

    const [cursorState, setCursorState] = useState<CursorState>({
        mode: CursorMode.Hidden,
    });

    const [reaction, setReaction] = useState<Reaction[]>([]);

    const broadcast = useBroadcastEvent();

    // to cleanup the reactions that are being saved in the state after
    // a user has clicked on them
    useInterval(() => {
        setReaction((reaction) =>
            reaction.filter((r) => r.timestamp > Date.now() - 4000)
        );
    }, 1000);

    useInterval(() => {
        if (
            cursorState.mode === CursorMode.Reaction &&
            cursorState.isPressed &&
            cursor
        ) {
            setReaction((reactions) =>
                reactions.concat([
                    {
                        point: { x: cursor.x, y: cursor.y },
                        value: cursorState.reaction,
                        timestamp: Date.now(),
                    },
                ])
            );

            broadcast({
                x: cursor.x,
                y: cursor.y,
                value: cursorState.reaction,
            });
        }
    }, 100);

    useEventListener((eventData) => {
        const event = eventData.event as ReactionEvent;

        setReaction((reactions) =>
            reactions.concat([
                {
                    point: { x: event.x, y: event.y },
                    value: event.value,
                    timestamp: Date.now(),
                },
            ])
        );
    });

    const handlePointerMove = useCallback((event: React.PointerEvent) => {
        event.preventDefault();

        if (
            cursor == null ||
            cursorState.mode !== CursorMode.ReactionSelector
        ) {
            const x =
                event.clientX - event.currentTarget.getBoundingClientRect().x;
            const y =
                event.clientY - event.currentTarget.getBoundingClientRect().y;

            updateMyPresence({ cursor: { x, y } });
        }
    }, []);

    const handlePointerLeave = useCallback((event: React.PointerEvent) => {
        setCursorState({ mode: CursorMode.Hidden });

        updateMyPresence({ cursor: null, message: null });
    }, []);

    const handlePointerDown = useCallback(
        (event: React.PointerEvent) => {
            const x =
                event.clientX - event.currentTarget.getBoundingClientRect().x;
            const y =
                event.clientY - event.currentTarget.getBoundingClientRect().y;

            updateMyPresence({ cursor: { x, y } });

            setCursorState((state: CursorState) =>
                cursorState.mode === CursorMode.Reaction
                    ? { ...state, isPressed: true }
                    : state
            );
        },
        [cursorState.mode, setCursorState]
    );

    const handlePointerUp = useCallback(
        (event: React.PointerEvent) => {
            setCursorState((state: CursorState) =>
                cursorState.mode === CursorMode.Reaction
                    ? { ...state, isPressed: true }
                    : state
            );
        },
        [cursorState.mode, setCursorState]
    );

    useEffect(() => {
        const onKeyUp = (event: KeyboardEvent) => {
            if (event.key === "/") {
                setCursorState({
                    mode: CursorMode.Chat,
                    previousMessage: null,
                    message: "",
                });
            } else if (event.key === "Escape") {
                updateMyPresence({ message: "" });
                setCursorState({ mode: CursorMode.Hidden });
            } else if (event.key === "e") {
                setCursorState({
                    mode: CursorMode.ReactionSelector,
                });
            }
        };

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "/") {
                event.preventDefault();
            }
        };

        window.addEventListener("keyup", onKeyUp);
        window.addEventListener("keydown", onKeyDown);

        return () => {
            window.removeEventListener("keyup", onKeyUp);
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [updateMyPresence]);

    const setReactions = useCallback((reaction: string) => {
        setCursorState({
            mode: CursorMode.Reaction,
            reaction,
            isPressed: false,
        });
    }, []);

    const handleContextMenuClick = useCallback((key: string) => {
        switch (key) {
            case "Chat":
                setCursorState({
                    mode: CursorMode.Chat,
                    previousMessage: null,
                    message: "",
                });
                break;

            case "Undo":
                undo();
                break;

            case "Redo":
                redo();
                break;

            case "Reactions":
                setCursorState({
                    mode: CursorMode.ReactionSelector,
                });
                break;

            default:
                break;
        }
    }, []);

    return (
        <ContextMenu>
            <ContextMenuTrigger
                id="canvas"
                className=" relative h-full w-full flex flex-1 justify-center items-center "
                onPointerMove={handlePointerMove}
                onPointerLeave={handlePointerLeave}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
            >
                <canvas ref={canvasRef} />

                {reaction.map((r) => (
                    <FlyingReaction
                        key={r.timestamp.toString()}
                        x={r.point.x}
                        y={r.point.y}
                        timestamp={r.timestamp}
                        value={r.value}
                    />
                ))}

                {cursor && (
                    <CursorChat
                        cursor={cursor}
                        cursorState={cursorState}
                        setCursorState={setCursorState}
                        updateMyPresence={updateMyPresence}
                    />
                )}

                {cursorState.mode === CursorMode.ReactionSelector && (
                    <ReactionSelector setReaction={setReactions} />
                )}

                <LiveCursors others={others} />

                <Comments />
            </ContextMenuTrigger>

            <ContextMenuContent className=" right-menu-content">
                {shortcuts.map((item) => (
                    <ContextMenuItem
                        key={item.key}
                        onClick={() => handleContextMenuClick(item.name)}
                        className="right-menu-item"
                    >
                        <p>{item.name}</p>
                        <p className=" text-xs text-primary-grey-300 ">
                            {item.shortcut}
                        </p>
                    </ContextMenuItem>
                ))}
            </ContextMenuContent>
        </ContextMenu>
    );
};

export default Live;
