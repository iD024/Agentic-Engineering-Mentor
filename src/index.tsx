import React from 'react';
import { render } from 'ink';
import { App } from './App';
import { InputRouter } from './InputRouter';

const router = new InputRouter(process.stdin);
render(<App router={router} />);
