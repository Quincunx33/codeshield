CREATE TABLE `findings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scanId` int NOT NULL,
	`ruleId` varchar(32) NOT NULL,
	`severity` enum('critical','high','medium','low','info') NOT NULL,
	`category` enum('security','quality','duplication') NOT NULL,
	`title` varchar(240) NOT NULL,
	`message` text NOT NULL,
	`remediation` text NOT NULL,
	`explanation` text,
	`file` varchar(500) NOT NULL,
	`line` int NOT NULL,
	`language` varchar(32) NOT NULL,
	`snippet` text,
	CONSTRAINT `findings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scanSources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`scanId` int NOT NULL,
	`storageKey` varchar(500) NOT NULL,
	`originalName` varchar(255) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	CONSTRAINT `scanSources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`projectName` varchar(180) NOT NULL,
	`status` enum('completed','failed') NOT NULL DEFAULT 'completed',
	`filesScanned` int NOT NULL,
	`criticalCount` int NOT NULL DEFAULT 0,
	`highCount` int NOT NULL DEFAULT 0,
	`mediumCount` int NOT NULL DEFAULT 0,
	`lowCount` int NOT NULL DEFAULT 0,
	`infoCount` int NOT NULL DEFAULT 0,
	`sourceKey` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scans_id` PRIMARY KEY(`id`)
);
