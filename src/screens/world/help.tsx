import React, {useContext, useEffect, useState} from 'react';
import {FlatList} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {AppNavStack} from '../index';
import {ListSeparator, TwoLine} from '../../components/listItems';
import FullScreenLoading from '../../components/loading';
import useContentfulConfig from './actions/useContentfulConfig';
import {Article} from '../../utils/interface';
import {ArticlesContext} from '../../context/articlesContext';
import analytics from '@react-native-firebase/analytics';

type ScreenNavigationProp = StackNavigationProp<AppNavStack, 'Help'>;

type Props = {
  navigation: ScreenNavigationProp;
};

export default function Help({navigation}: Props) {
  const [data, setData] = useState<Article[]>();
  const [loading, setLoading] = useState(true);

  const contentfulClient = useContentfulConfig();
  const articlesContext = useContext(ArticlesContext);

  useEffect(() => {
    const getArticles = async () => {
      try {
        if (contentfulClient) {
          const articles = await contentfulClient.getEntries();
          let articlesList: Article[] = [];

          for (const article of articles.items) {
            articlesList.push(article);
            console.log(article);
          }

          setData(articlesList);
          setLoading(false);
        }
      } catch (error) {
        setLoading(false);
        throw new Error(error);
      }
    };
    getArticles();
  }, [contentfulClient]);

  const onSelectArticle = async (id: string) => {
    const selectedArticle = data.filter((article) => article.sys.id === id);

    articlesContext.setArticles(selectedArticle);

    await analytics().logEvent('help_article', {
      name: selectedArticle[0].fields.title,
      id: id,
    });

    navigation.navigate('Help Article', {
      id,
    });
  };

  if (loading) {
    return <FullScreenLoading visible={true} />;
  }

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.sys.id}
      ItemSeparatorComponent={() => <ListSeparator />}
      renderItem={({item}) => (
        <TwoLine
          title={item.fields.title}
          sub={item.fields.tags.join(', ')}
          onPress={() => onSelectArticle(item.sys.id)}
        />
      )}
    />
  );
}
