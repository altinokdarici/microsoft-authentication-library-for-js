/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * @napi-rs/keyring is a native Node.js module that provides a simple API for reading and writing passwords to the operating system's secure store.
 *  - Linux: The DBus-based Secret Service, the kernel keyutils, and a combo of the two.
 *  - FreeBSD, OpenBSD: The DBus-based Secret Service.
 *  - macOS, iOS: The local keychain.
 *  - Windows: The Windows Credential Manager.
 * More info: https://github.com/hwchen/keyring-rs?tab=readme-ov-file#platforms
 */
import { Entry } from "@napi-rs/keyring";
import type { Logger, LoggerOptions } from "@azure/msal-common";
import { dirname } from "path";
import { isNodeError } from "../utils/TypeGuards.js";
import { PersistenceError } from "../error/PersistenceError.js";
import { BasePersistence } from "./BasePersistence.js";
import type { IPersistence } from "./IPersistence.js";
import { FilePersistence } from "./FilePersistence.js";

/**
 * Uses reads and writes passwords to operating systems secure store
 *
 * serviceName: Identifier used as key for whatever value is stored
 * accountName: Account under which password should be stored
 *
 */
export class KeyRingPersistence
    extends BasePersistence
    implements IPersistence
{
    private readonly entry: Entry;
    private readonly filePersistence: FilePersistence;

    private constructor(
        filePersistence: FilePersistence,
        readonly service: string,
        readonly account: string
    ) {
        super();
        this.entry = new Entry(service, account);
        this.filePersistence = filePersistence;
    }

    public static async create(
        fileLocation: string,
        serviceName: string,
        accountName: string,
        loggerOptions?: LoggerOptions
    ): Promise<KeyRingPersistence> {
        const filePersistence = await FilePersistence.create(
            fileLocation,
            loggerOptions
        );

        return new KeyRingPersistence(
            filePersistence,
            serviceName,
            accountName
        );
    }

    public async save(contents: string): Promise<void> {
        try {
            this.entry.setPassword(contents);
        } catch (e) {
            if (isNodeError(e)) {
                throw PersistenceError.createKeyRingPersistenceError(e.message);
            }
            throw e;
        }

        // Write dummy data to update file mtime
        await this.filePersistence.save("{}");
    }

    public load(): Promise<string | null> {
        try {
            return Promise.resolve(this.entry.getPassword());
        } catch (e) {
            if (isNodeError(e)) {
                throw PersistenceError.createKeyRingPersistenceError(e.message);
            }
            throw e;
        }
    }

    public async delete(): Promise<boolean> {
        try {
            await this.filePersistence.delete();

            return this.entry.deletePassword();
        } catch (e) {
            if (isNodeError(e)) {
                throw PersistenceError.createKeyRingPersistenceError(e.message);
            }
            throw e;
        }
    }

    reloadNecessary(lastSync: number): Promise<boolean> {
        return this.filePersistence.reloadNecessary(lastSync);
    }

    getFilePath(): string {
        return this.filePersistence.getFilePath();
    }
    getLogger(): Logger {
        return this.filePersistence.getLogger();
    }

    createForPersistenceValidation(): Promise<IPersistence> {
        const testCacheFileLocation = `${dirname(
            this.filePersistence.getFilePath()
        )}/test.cache`;
        return KeyRingPersistence.create(
            testCacheFileLocation,
            "persistenceValidationServiceName",
            "persistencValidationAccountName"
        );
    }
}
