import React, { useCallback, useEffect, useState, useMemo } from 'react'
import { format } from 'date-fns'
import { Alert, Platform } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/Feather'
import DateTimePicker from '@react-native-community/datetimepicker'

import {
  Container,
  Header,
  BackButton,
  HeaderTitle,
  UserAvatar,
  Content,
  ProvidersListContainer,
  ProvidersList,
  ProviderContainer,
  ProviderAvatar,
  ProviderName,
  Calendar,
  Title,
  OpenDatePicker,
  OpenDatePickerText,
  Schedule,
  Section,
  SectionTitle,
  SectionContent,
  Hour,
  HourText,
  CreateAppointmentButton,
  CreateAppointmentButtonText,
} from './styles'

import { useAuth } from '../../hooks/Auth'
import api from '../../services/api'

interface RouteParams {
  providerId: string
}

export interface Provider {
  id: string
  name: string
  avatar_url: string
}

interface AvailabilityItem {
  hour: number
  available: boolean
}

const CreateAppointment: React.FC = () => {
  const { user } = useAuth()
  const route = useRoute()
  const { goBack, navigate } = useNavigation()

  const routeParams = route.params as RouteParams

  const [availability, setAvailability] = useState<AvailabilityItem[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedHour, setSelectedHour] = useState(0)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [providers, setProviders] = useState()
  const [selectedProvider, setSelectedProvider] = useState(
    routeParams.providerId,
  )

  useEffect(() => {
    api.get('providers').then(response => {
      setProviders(response.data)
    })
  }, [])

  useEffect(() => {
    api
      .get(`providers/${selectedProvider}/day-availability`, {
        params: {
          year: selectedDate.getFullYear(),
          month: selectedDate.getMonth() + 1,
          day: selectedDate.getDate(),
        },
      })
      .then(response => {
        setAvailability(response.data)
      })
  }, [selectedDate, selectedProvider])

  const navigateBack = useCallback(() => {
    goBack()
  }, [goBack])

  const handleSelectProvider = useCallback((providerId: string) => {
    setSelectedProvider(providerId)
  }, [])

  const handleToogleDatePicker = useCallback(() => {
    setShowDatePicker(oldState => !oldState)
  }, [])

  const handleDateChanged = useCallback(
    (event: Event, date: Date | undefined) => {
      if (Platform.OS === 'android') {
        setShowDatePicker(false)
      }

      if (date) {
        setSelectedDate(date)
      }
    },
    [],
  )

  const morningAvailability = useMemo(() => {
    return availability
      .filter(({ hour }) => hour < 12)
      .map(({ hour, available }) => {
        return {
          hour,
          available,
          hourFormatted: format(new Date().setHours(hour), 'HH:00'),
        }
      })
  }, [availability])

  const afternoonAvailability = useMemo(() => {
    return availability
      .filter(({ hour }) => hour >= 12)
      .map(({ hour, available }) => {
        return {
          hour,
          available,
          hourFormatted: format(new Date().setHours(hour), 'HH:00'),
        }
      })
  }, [availability])

  const handleSelectHour = useCallback((hour: number) => {
    setSelectedHour(hour)
  }, [])

  const handleCreateAppointment = useCallback(async () => {
    try {
      const date = new Date(selectedDate)

      date.setHours(selectedHour)
      date.setMinutes(0)

      await api.post('appointments', {
        provider_id: selectedProvider,
        date,
      })

      navigate('AppointmentCreated', { date: date.getTime() })
    } catch (err) {
      Alert.alert(
        'Erro ao criar agendamento',
        'Ocorreu um erro ao tentar criar um agendamento, tente novamente',
      )
    }
  }, [selectedDate, selectedHour, selectedProvider, navigate])

  return (
    <Container>
      <Header>
        <BackButton onPress={navigateBack}>
          <Icon name="chevron-left" size={24} color="#999591" />
        </BackButton>

        <HeaderTitle>Cabeleireiros</HeaderTitle>

        <UserAvatar source={{ uri: user.avatar_url }} />
      </Header>
      <Content>
        <ProvidersListContainer>
          <ProvidersList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={providers}
            keyExtractor={provider => provider.id}
            renderItem={({ item: provider }) => (
              <ProviderContainer
                onPress={() => handleSelectProvider(provider.id)}
                selected={provider.id === selectedProvider}>
                <ProviderAvatar source={{ uri: provider.avatar_url }} />
                <ProviderName selected={provider.id === selectedProvider}>
                  {provider.name}
                </ProviderName>
              </ProviderContainer>
            )}
          />
        </ProvidersListContainer>

        <Calendar>
          <Title>Escolha a data</Title>
          <OpenDatePicker onPress={handleToogleDatePicker}>
            <OpenDatePickerText>Selecionar outra data</OpenDatePickerText>
          </OpenDatePicker>
          {showDatePicker && (
            <DateTimePicker
              {...(Platform.OS === 'ios' && { textColor: '#f4ede8' })}
              mode="date"
              display={Platform.OS === 'android' ? 'calendar' : 'spinner'}
              value={selectedDate}
              onChange={handleDateChanged}
            />
          )}
        </Calendar>

        <Schedule>
          <Title>Escolha o hor??rio</Title>

          <Section>
            <SectionTitle>Manh??</SectionTitle>

            <SectionContent>
              {morningAvailability.map(({ hourFormatted, available, hour }) => (
                <Hour
                  enabled={available}
                  selected={selectedHour === hour}
                  key={hourFormatted}
                  available={available}
                  onPress={() => handleSelectHour(hour)}>
                  <HourText selected={selectedHour === hour}>
                    {hourFormatted}
                  </HourText>
                </Hour>
              ))}
            </SectionContent>
          </Section>

          <Section>
            <SectionTitle>Tarde</SectionTitle>

            <SectionContent>
              {afternoonAvailability.map(
                ({ hourFormatted, available, hour }) => (
                  <Hour
                    enabled={available}
                    selected={selectedHour === hour}
                    key={hourFormatted}
                    available={available}
                    onPress={() => handleSelectHour(hour)}>
                    <HourText selected={selectedHour === hour}>
                      {hourFormatted}
                    </HourText>
                  </Hour>
                ),
              )}
            </SectionContent>
          </Section>
        </Schedule>

        <CreateAppointmentButton onPress={handleCreateAppointment}>
          <CreateAppointmentButtonText>Agendar</CreateAppointmentButtonText>
        </CreateAppointmentButton>
      </Content>
    </Container>
  )
}
export default CreateAppointment
