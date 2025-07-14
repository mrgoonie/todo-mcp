import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { Database } from "../src/db";
import { TodoListRepository } from "../src/models/todo-list.repository";
import { unlinkSync } from "node:fs";

describe("TodoListRepository", () => {
	let db: Database;
	let repo: TodoListRepository;
	const testDbPath = "./test-todo-list.db";

	beforeEach(async () => {
		db = new Database(testDbPath);
		await db.initialize();
		repo = new TodoListRepository(db);
	});

	afterEach(async () => {
		await db.close();
		try {
			unlinkSync(testDbPath);
		} catch {}
	});

	test("should create a todo list", async () => {
		const list = await repo.create({
			name: "Test List",
			description: "Test Description",
		});

		expect(list.id).toBeTruthy();
		expect(list.name).toBe("Test List");
		expect(list.description).toBe("Test Description");
		expect(list.created_at).toBeInstanceOf(Date);
		expect(list.updated_at).toBeInstanceOf(Date);
	});

	test("should find todo list by id", async () => {
		const created = await repo.create({ name: "Test List" });
		const found = await repo.findById(created.id);

		expect(found).toBeTruthy();
		expect(found?.id).toBe(created.id);
		expect(found?.name).toBe("Test List");
	});

	test("should return null for non-existent id", async () => {
		const found = await repo.findById("non-existent");
		expect(found).toBeNull();
	});

	test("should find all todo lists", async () => {
		const list1 = await repo.create({ name: "List 1" });
		// Add small delay to ensure different timestamps
		await new Promise((resolve) => setTimeout(resolve, 10));
		const list2 = await repo.create({ name: "List 2" });
		await new Promise((resolve) => setTimeout(resolve, 10));
		const list3 = await repo.create({ name: "List 3" });

		const lists = await repo.findAll();
		expect(lists.length).toBe(3);

		// Verify lists are ordered by created_at DESC (most recent first)
		expect(lists[0].id).toBe(list3.id);
		expect(lists[1].id).toBe(list2.id);
		expect(lists[2].id).toBe(list1.id);
	});

	test("should update todo list", async () => {
		const created = await repo.create({ name: "Original Name" });

		const updated = await repo.update(created.id, {
			name: "Updated Name",
			description: "New Description",
		});

		expect(updated?.name).toBe("Updated Name");
		expect(updated?.description).toBe("New Description");
	});

	test("should delete todo list", async () => {
		const created = await repo.create({ name: "To Delete" });

		const result = await repo.delete(created.id);
		expect(result).toBe(true);

		const found = await repo.findById(created.id);
		expect(found).toBeNull();
	});
});
