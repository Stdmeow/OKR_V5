const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();
const path = require('path');

const app = express();
const port = process.env.PORT || 1337;
const dbFilePath = path.join(__dirname, 'db.json');

app.use(bodyParser.json());

const readDb = async () => {
    try {
        const data = await fs.readFile(dbFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Ошибка чтения файла db.json:', error);
        return [];
    }
};

const writeDb = async (data) => {
    try {
        await fs.writeFile(dbFilePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error('Ошибка записи в файл db.json:', error);
    }
};

app.get('/wears', async (req, res) => {
    try {
        const wears = await readDb();
        res.status(200).json(wears);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при получении данных' });
    }
});

app.get('/wears/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const wears = await readDb();
        const wear = wears.find(item => item.id === id);
        if (wear) {
            res.status(200).json(wear);
        } else {
            res.status(404).json({ message: 'Элемент одежды не найден' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при получении данных' });
    }
});

app.post('/wears', async (req, res) => {
    const { name, sale } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'Поле "name" обязательно для создания элемента.' });
    }

    const newWear = {
        id: uuidv4(),
        name,
        sale: sale || 0,
        createdAt: new Date().toISOString(),
    };

    try {
        const wears = await readDb();
        wears.push(newWear);
        await writeDb(wears);
        res.status(201).json(newWear);
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при создании элемента одежды' });
    }
});

app.put('/wears/:id', async (req, res) => {
    const id = req.params.id;
    const { name, sale } = req.body;
    if (!name || sale === undefined) {
        return res.status(400).json({ message: 'Поля "name" и "sale" обязательны для обновления.' });
    }

    const updatedWear = {
        id,
        name,
        sale,
    };

    try {
        const wears = await readDb();
        const index = wears.findIndex(item => item.id === id);
        if (index !== -1) {
            const originalCreatedAt = wears[index].createdAt;
            wears[index] = { ...updatedWear, createdAt: originalCreatedAt };
            await writeDb(wears);
            res.status(200).json(wears[index]);
        } else {
            res.status(404).json({ message: 'Элемент одежды не найден' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при обновлении элемента одежды' });
    }
});

app.patch('/wears/:id', async (req, res) => {
    const id = req.params.id;
    const { sale } = req.body;
    if (sale === undefined) {
        return res.status(400).json({ message: 'Поле "sale" обязательно для обновления скидки.' });
    }

    try {
        const wears = await readDb();
        const index = wears.findIndex(item => item.id === id);
        if (index !== -1) {
            wears[index].sale = sale;
            await writeDb(wears);
            res.status(200).json(wears[index]);
        } else {
            res.status(404).json({ message: 'Элемент одежды не найден' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при обновлении скидки' });
    }
});

app.delete('/wears/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const wears = await readDb();
        const initialLength = wears.length;
        const updatedWears = wears.filter(item => item.id !== id);
        await writeDb(updatedWears);
        if (updatedWears.length < initialLength) {
            res.status(204).send();
        } else {
            res.status(404).json({ message: 'Элемент одежды не найден' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Ошибка при удалении элемента одежды' });
    }
});

app.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
});