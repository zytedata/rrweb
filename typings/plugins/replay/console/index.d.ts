import { LogLevel, logData } from '../../record/console';
import { ReplayPlugin } from '../../../types';
declare type ReplayLogger = Partial<Record<LogLevel, (data: logData) => void>>;
declare type LogReplayConfig = {
    level?: LogLevel[] | undefined;
    replayLogger: ReplayLogger | undefined;
};
export declare const getReplayConsolePlugin: (options?: LogReplayConfig) => ReplayPlugin;
export {};
