import React from 'react'
import { render } from '@testing-library/react-native'

import SignIn from '../../pages/SignIn'

jest.mock('react-native-vector-icons/Feather', () => 'Icon')

jest.mock('@react-navigation/native', () => {
  return {
    useNavigation: jest.fn(),
  }
})

describe('SignIn page', () => {
  beforeAll(() => {
    jest.mock('@react-native-community/async-storage')
  })

  const { getByPlaceholderText } = render(<SignIn />)

  expect(getByPlaceholderText('E-mail')).toBeTruthy()
  expect(getByPlaceholderText('Senha')).toBeTruthy()
})
