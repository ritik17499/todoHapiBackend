const Hapi = require('@hapi/hapi');
const { Sequelize, DataTypes } = require('sequelize');
const H2o2 = require('@hapi/h2o2');

const sequelize = new Sequelize('todo', 'root', 'Iamno1@@', {
  host: 'localhost',
  dialect: 'mysql'
});
const init = async () => {
  
  const server = Hapi.server({
    port: process.env.PORT || 3000,
    host: 'localhost',
    routes: {
      cors: {
          origin: ['*'], // an array of origins or 'ignore'    
          headers: ['Accept', 'Authorization', 'Content-Type', 'If-None-Match'], // an array of strings - 'Access-Control-Allow-Headers'
          exposedHeaders: ['WWW-Authenticate', 'Server-Authorization'], // an array of exposed headers - 'Access-Control-Expose-Headers',
          additionalExposedHeaders: ['Accept'], // an array of additional exposed headers
          maxAge: 60,
          credentials: true // boolean - 'Access-Control-Allow-Credentials'
      },
      validate: {
          failAction: async (req, res, err) => {
              return err
          },
          options: {
              abortEarly: false
          }
      }
  }
  });

  const Task = sequelize.define('Task', {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true
    },
    completed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  });

  server.route({
    method: 'GET',
    path: '/todoApp/tasks',
    handler: async (request, h) => {
      const tasks = await Task.findAll();
      return tasks;
    }
  });

  server.route({
    method: 'POST',
    path: '/todoApp/tasks',
    handler: async (request, h) => {
      try{
        
        const task = {
        title: request.payload.title,
        completed: request.payload.completed ? request.payload.completed : false
      };
        const data = await Task.create(task);
        return data;
      } catch (err) {
        return h.response({ message: err.message }).code(500);
      }
    }
  });

  server.route({
    method: 'PUT',
    path: '/todoApp/tasks/{id}',
    handler: async (request, h) => {
      const taskId = request.params.id;
      try {
        const task = await Task.findByPk(taskId);
        if (!task) {
          return h.response({ error: 'Task not found' }).code(404);
        }
        task.title = request.payload.title;
        task.description = request.payload.description;
        task.completed = true;
        await task.save();
        return task;
      } catch (err) {
        return h.response({ message: err.message }).code(500);
      }
    }
  });

  server.route({
    method: 'DELETE',
    path: '/todoApp/tasks/{id}',
    handler: async (request, h) => {
      const taskId = request.params.id;
      try {
        const task = await Task.findByPk(taskId);
        if (!task) {
          return h.response({ error: 'Task not found' }).code(404);
        }
        await task.destroy();
        return { message: 'Task deleted' };
      } catch (err) {
        return h.response({ message: err.message }).code(500);
      }
    }
  });

  await sequelize.sync(); // Sync database before starting server
  await server.register(H2o2);
  await server.start();
  console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {
  console.log(err);
  process.exit(1);
});

init();
